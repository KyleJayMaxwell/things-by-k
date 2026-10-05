// src/app/api/webhooks/stripe/route.ts
// Handles Stripe webhook events — creates orders in Supabase on successful payment
// and sends an order confirmation email via Resend

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/email'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Only handle checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session

  try {
    await handleCheckoutComplete(session)
  } catch (err) {
    console.error('Failed to process webhook:', err)
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient()

  // Fetch line items from Stripe
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  })

  // Generate order number
  const { data: orderNumberData } = await supabase
    .rpc('generate_order_number')
  const orderNumber = orderNumberData as string

  // Re-fetch the session so shipping_details is fully populated
  // (the webhook payload can arrive before Stripe has settled all fields)
  const fullSession = await stripe.checkout.sessions.retrieve(session.id)
  const userId = session.metadata?.user_id || null
  const shippingDetails = fullSession.shipping_details
  const address = shippingDetails?.address
  const customerEmail = fullSession.customer_details?.email ?? ''

  const shippingAddress = {
    name: shippingDetails?.name ?? '',
    line1: address?.line1 ?? '',
    line2: address?.line2 ?? null,
    city: address?.city ?? '',
    state: address?.state ?? '',
    postal_code: address?.postal_code ?? '',
    country: address?.country ?? '',
  }

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: userId || null,
      email: customerEmail,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      status: 'processing',
      subtotal: fullSession.amount_subtotal ?? 0,
      shipping_cost: fullSession.shipping_cost?.amount_total ?? 0,
      total: fullSession.amount_total ?? 0,
      shipping_address: shippingAddress,
    })
    .select()
    .single()

  if (orderError || !order) {
    throw new Error(`Failed to insert order: ${orderError?.message}`)
  }

  // Insert order items, decrement stock, and collect items for email
  const emailItems: { name: string; quantity: number; price: number }[] = []

  for (const item of lineItems.data) {
    const stripeProduct = item.price?.product as Stripe.Product
    const productId = stripeProduct?.metadata?.product_id

    if (!productId) continue

    // Insert order item
    const { data: orderItem } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: productId,
      product_name: stripeProduct.name,
      price: item.price?.unit_amount ?? 0,
      quantity: item.quantity ?? 1,
    }).select('id').single()

    // Save the note for a handwritten card. Kept separate from the insert so a
    // missing column (handwritten-option.sql not run yet) can't drop the item.
    const message = stripeProduct.metadata?.message
      || (stripeProduct.metadata?.handwritten === 'true' ? 'No note given: freestyle it' : null)
    if (orderItem && message) {
      const { error: messageError } = await supabase
        .from('order_items')
        .update({ handwritten_message: message })
        .eq('id', orderItem.id)
      if (messageError) console.error('Failed to save handwritten message:', messageError.message)
    }

    // Decrement stock
    await supabase.rpc('decrement_stock', {
      p_product_id: productId,
      p_quantity: item.quantity ?? 1,
    })

    emailItems.push({
      name: stripeProduct.name,
      quantity: item.quantity ?? 1,
      price: item.price?.unit_amount ?? 0,
    })
  }

  // Send order confirmation email — non-fatal if it fails
  if (customerEmail) {
    try {
      await sendOrderConfirmation({
        to: customerEmail,
        orderNumber,
        items: emailItems,
        subtotal: fullSession.amount_subtotal ?? 0,
        shippingCost: fullSession.shipping_cost?.amount_total ?? 0,
        total: fullSession.amount_total ?? 0,
        shippingAddress,
      })
    } catch (emailErr) {
      // Log but don't throw — order is already saved, email failure shouldn't
      // cause Stripe to retry and risk duplicate orders
      console.error('Order confirmation email failed:', emailErr)
    }
  }
}