// src/app/api/admin/orders/[id]/refund/route.ts
// Admin-only: refund an order in full through Stripe, mark it refunded,
// restock unshipped items and email the customer.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { markOrderRefunded } from '@/lib/refunds'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { id } = await params
  const service = createServiceClient()
  const { data: existing, error: fetchError } = await service
    .from('orders')
    .select('id, status, total, stripe_payment_intent')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (existing.status === 'refunded') {
    return NextResponse.json({ error: 'This order is already refunded' }, { status: 400 })
  }

  let refundAmount = existing.total
  try {
    const refund = await stripe.refunds.create(
      { payment_intent: existing.stripe_payment_intent, metadata: { order_id: existing.id } },
      // Same key for the same order, so a double click can't refund twice
      { idempotencyKey: `refund-${existing.id}` }
    )
    refundAmount = refund.amount
  } catch (err) {
    // Already refunded in the Stripe dashboard: just record it here
    if (!(err instanceof Stripe.errors.StripeError && err.code === 'charge_already_refunded')) {
      const message = err instanceof Error ? err.message : 'Stripe refund failed'
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  let order
  try {
    order = await markOrderRefunded({ id: existing.id }, refundAmount)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { error: `Refunded in Stripe, but saving the order failed: ${message}` },
      { status: 500 }
    )
  }

  // Null means the charge.refunded webhook got there first; return the saved order
  if (!order) {
    const { data } = await service.from('orders').select().eq('id', id).single()
    order = data
  }

  return NextResponse.json({ order })
}
