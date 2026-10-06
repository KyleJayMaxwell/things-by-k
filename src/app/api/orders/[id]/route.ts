// src/app/api/orders/[id]/route.ts
// Fetches order details using Stripe session ID — used by the success page

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    })

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
      shippingAddress: session.shipping_details?.address,
      lineItems: session.line_items?.data.map(item => ({
        name: (item.price?.product as { name: string })?.name,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
      amountSubtotal: session.amount_subtotal,
      shippingCost: session.shipping_cost?.amount_total,
      amountTotal: session.amount_total,
    })
  } catch (err) {
    console.error('Failed to retrieve session:', err)
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
}
