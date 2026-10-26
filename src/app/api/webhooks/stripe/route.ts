// src/app/api/webhooks/stripe/route.ts
// Handles Stripe webhook events — creates orders in Supabase on successful payment
// and sends an order confirmation email via Resend. Also marks orders refunded
// when a refund is issued from the Stripe dashboard (charge.refunded).

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/email'
import { markOrderRefunded } from '@/lib/refunds'
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

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
    } else if (event.type === 'charge.refunded') {
      await handleChargeRefunded((event.data.object as Stripe.Charge).id)
    }
  } catch (err) {
    console.error('Failed to process webhook:', err)
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient()

  // Stripe can deliver the same event more than once (retries, manual resend).
  // If the order already exists, there's nothing to do.
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle()
  if (existingOrder) return

  // Fetch every line item from Stripe (the API returns 10 per page by default)
  const lineItems = await stripe.checkout.sessions
    .listLineItems(session.id, { expand: ['data.price.product'], limit: 100 })
    .autoPagingToArray({ limit: 1000 })

  const items = lineItems.map(item => {
    const stripeProduct = item.price?.product as Stripe.Product
    const productId = stripeProduct?.metadata?.product_id
    // Every line checkout creates carries a product id. Fail loudly (Stripe
    // retries and shows the error) rather than save an order missing an item.
    if (!productId) throw new Error(`Line item ${item.id} on ${session.id} has no product_id`)
    return {
      product_id: productId,
      product_name: stripeProduct.name,
      price: item.price?.unit_amount ?? 0,
      quantity: item.quantity ?? 1,
      handwritten_message: stripeProduct.metadata?.message
        || (stripeProduct.metadata?.handwritten === 'true' ? 'No note given: freestyle it' : null),
    }
  })

  // Re-fetch the session so shipping_details is fully populated
  // (the webhook payload can arrive before Stripe has settled all fields)
  const fullSession = await stripe.checkout.sessions.retrieve(session.id)
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

  // Order, items and stock are saved in one transaction (supabase/create-order.sql),
  // so a failure leaves nothing behind and Stripe's retry starts clean
  const { data, error } = await supabase.rpc('create_order', {
    p_order: {
      user_id: session.metadata?.user_id ?? '',
      email: customerEmail,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      subtotal: fullSession.amount_subtotal ?? 0,
      shipping_cost: fullSession.shipping_cost?.amount_total ?? 0,
      total: fullSession.amount_total ?? 0,
      shipping_address: shippingAddress,
    },
    p_items: items,
  })
  if (error || !data) {
    throw new Error(`Failed to create order: ${error?.message}`)
  }

  const order = data as { order_number: string; created: boolean }
  // Another delivery of this event saved the order first and sent the email
  if (!order.created) return

  // Send order confirmation email — non-fatal if it fails
  if (customerEmail) {
    try {
      await sendOrderConfirmation({
        to: customerEmail,
        orderNumber: order.order_number,
        items: items.map(({ product_name, quantity, price }) => ({ name: product_name, quantity, price })),
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

async function handleChargeRefunded(chargeId: string) {
  // Re-fetch so the fields match our API version, not the endpoint's
  const charge = await stripe.charges.retrieve(chargeId)
  if (!charge.refunded || !charge.payment_intent) return  // partial refunds stay as-is

  const paymentIntent = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent.id

  await markOrderRefunded({ paymentIntent }, charge.amount_refunded)
}
