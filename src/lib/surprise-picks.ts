// src/lib/surprise-picks.ts
// Server-only stock helpers for Surprise me picks

import type { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = ReturnType<typeof createServiceClient>

// Applies stock changes per product: positive puts cards back, negative takes them
export async function adjustStock(service: ServiceClient, delta: Map<string, number>) {
  for (const [productId, change] of delta) {
    if (change === 0) continue
    const { error } = change > 0
      ? await service.rpc('increment_stock', { p_product_id: productId, p_quantity: change })
      : await service.rpc('decrement_stock', { p_product_id: productId, p_quantity: -change })
    if (error) console.error('Failed to adjust stock for a Surprise me pick:', error.message)
  }
}

// Puts back the designs picked for an order's Surprise me cards (unshipped refund)
export async function restockSurprisePicks(service: ServiceClient, orderItemIds: string[]) {
  if (orderItemIds.length === 0) return
  const { data: picks, error } = await service
    .from('surprise_picks')
    .select('product_id')
    .in('order_item_id', orderItemIds)
  if (error || !picks?.length) return  // no picks, or surprise-me.sql not run yet
  const delta = new Map<string, number>()
  for (const p of picks) delta.set(p.product_id, (delta.get(p.product_id) ?? 0) + 1)
  await adjustStock(service, delta)
}
