// src/app/api/orders/[id]/route.ts
// Fetches order details using Stripe session ID — used by the success page.
// Anyone holding the success link can call this, so it only answers for an
// hour after checkout and never returns the street address.

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

const LINK_LIFETIME_SECONDS = 60 * 60
const NO_STORE = { 'Cache-Control': 'no-store' }

function notFound() {
  return NextResponse.json({ error: 'Session not found' }, { status: 404, headers: NO_STORE })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  if (!sessionId.startsWith('cs_')) return notFound()

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    })

    const ageSeconds = Date.now() / 1000 - session.created
    if (session.status !== 'complete' || ageSeconds > LINK_LIFETIME_SECONDS) {
      return notFound()
    }
    const address = session.shipping_details?.address

    // The order (and its number) is created by the Stripe webhook, which can
    // land a few seconds after the customer is redirected here. Null until then.
    const { data: order } = await createServiceClient()
      .from('orders')
      .select('order_number')
      .eq('stripe_session_id', session.id)
      .maybeSingle()

    return NextResponse.json({
      orderNumber: order?.order_number ?? null,
      customerEmail: session.customer_details?.email,
      shippingAddress: address && {
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      },
      lineItems: session.line_items?.data.map(item => ({
        name: (item.price?.product as { name: string })?.name,
        quantity: item.quantity,
        amount: item.amount_subtotal,
      })),
      amountSubtotal: session.amount_subtotal,
      shippingCost: session.shipping_cost?.amount_subtotal,
      amountTax: session.total_details?.amount_tax,
      amountTotal: session.amount_total,
    }, { headers: NO_STORE })
  } catch (err) {
    console.error('Failed to retrieve session:', err)
    return notFound()
  }
}
