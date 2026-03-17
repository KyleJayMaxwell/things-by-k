// src/app/api/webhooks/stripe/route.ts
// Handles Stripe webhook events — creates orders in Supabase on successful payment
// and sends an order confirmation email via Resend

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/email'
import Stripe from 'stripe'

// Required: tell Next.js not to parse the body (Stripe needs raw bytes to verify signature)
export const config = { api: { bodyParser: false } }

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

  const userId = session.metadata?.user_id || null
  const shippingDetails = session.shipping_details
  const address = shippingDetails?.address
  const customerEmail = session.customer_details?.email ?? ''

  const shippingAddress = {
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
      subtotal: session.amount_subtotal ?? 0,
      shipping_cost: session.shipping_cost?.amount_total ?? 0,
      total: session.amount_total ?? 0,
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
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: productId,
      product_name: stripeProduct.name,
      price: item.price?.unit_amount ?? 0,
      quantity: item.quantity ?? 1,
    })

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
        subtotal: session.amount_subtotal ?? 0,
        shippingCost: session.shipping_cost?.amount_total ?? 0,
        total: session.amount_total ?? 0,
        shippingAddress,
      })
    } catch (emailErr) {
      // Log but don't throw — order is already saved, email failure shouldn't
      // cause Stripe to retry and risk duplicate orders
      console.error('Order confirmation email failed:', emailErr)
    }
  }
}