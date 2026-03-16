// src/app/api/orders/[id]/route.ts
// Fetches order details using Stripe session ID — used by the success page

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    })

    return NextResponse.json({
      orderNumber: session.metadata?.order_number,
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
