// src/lib/refunds.ts
// Marks an order refunded, puts unshipped items back in stock, and emails the
// customer. Shared by the admin Refund button and the charge.refunded webhook.

import { createServiceClient } from '@/lib/supabase/server'
import { sendRefundNotice } from '@/lib/email'

type OrderMatch = { id: string } | { paymentIntent: string }

export async function markOrderRefunded(match: OrderMatch, refundAmount: number) {
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select('id, status, email, order_number, shipping_address, order_items(product_id, quantity)')
  query = 'id' in match ? query.eq('id', match.id) : query.eq('stripe_payment_intent', match.paymentIntent)
  const { data: existing } = await query.maybeSingle()
  if (!existing) return null

  // Only the call that flips the status does the restock and email. The admin
  // button's refund also fires charge.refunded, so both paths can run.
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_amount: refundAmount,
    })
    .eq('id', existing.id)
    .neq('status', 'refunded')
    .select()
    .maybeSingle()

  if (error) throw new Error(`Failed to mark order refunded: ${error.message}`)
  if (!order) return null  // already refunded

  // Items that never shipped are still on the shelf
  if (existing.status === 'processing') {
    for (const item of existing.order_items ?? []) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()
      if (!product) continue
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock + item.quantity })
        .eq('id', item.product_id)
      if (stockError) console.error('Failed to restock after refund:', stockError.message)
    }
  }

  // The refund is saved either way; a failed email shouldn't undo it
  if (existing.email) {
    try {
      await sendRefundNotice({
        to: existing.email,
        orderNumber: existing.order_number,
        recipientName: existing.shipping_address?.name,
        amount: refundAmount,
      })
    } catch (err) {
      console.error('Refund email failed:', err)
    }
  }

  return order
}
