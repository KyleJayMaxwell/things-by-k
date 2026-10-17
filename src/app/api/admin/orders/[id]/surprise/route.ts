// src/app/api/admin/orders/[id]/surprise/route.ts
// Admin-only: save which design was sent for each Mystery card on an order.
// Each pick takes 1 off that design's stock; changing or clearing a pick puts it back.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { adjustStock } from '@/lib/surprise-picks'

interface PickInput {
  itemId: string
  slot: number
  productId: string
}

function isPickInput(p: unknown): p is PickInput {
  if (!p || typeof p !== 'object') return false
  const { itemId, slot, productId } = p as Record<string, unknown>
  return typeof itemId === 'string' && typeof productId === 'string'
    && Number.isInteger(slot) && (slot as number) >= 0
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const picks: unknown = body?.picks
  if (!Array.isArray(picks) || !picks.every(isPickInput)) {
    return NextResponse.json({ error: 'Invalid picks' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: order } = await service
    .from('orders')
    .select('id, status, order_items(id, quantity, products(is_surprise))')
    .eq('id', id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (order.status === 'refunded') {
    return NextResponse.json({ error: 'Refunded orders can’t change' }, { status: 400 })
  }

  // Only Mystery items take picks, one per card
  const surpriseItems = new Map<string, number>()
  for (const item of order.order_items ?? []) {
    const product = item.products as unknown as { is_surprise?: boolean } | null
    if (product?.is_surprise) surpriseItems.set(item.id, item.quantity)
  }
  const seen = new Set<string>()
  for (const pick of picks) {
    const quantity = surpriseItems.get(pick.itemId)
    if (quantity === undefined || pick.slot >= quantity || seen.has(`${pick.itemId}:${pick.slot}`)) {
      return NextResponse.json({ error: 'A pick doesn’t match a Mystery card on this order' }, { status: 400 })
    }
    seen.add(`${pick.itemId}:${pick.slot}`)
  }

  // Designs must be real postcards, not the Mystery listing itself
  const productIds = [...new Set(picks.map(p => p.productId))]
  const { data: designs } = productIds.length
    ? await service
        .from('products')
        .select('id, name')
        .in('id', productIds)
        .eq('category', 'postcard')
        .eq('is_surprise', false)
    : { data: [] as { id: string; name: string }[] }
  const names = new Map((designs ?? []).map(d => [d.id, d.name]))
  if (productIds.some(pid => !names.has(pid))) {
    return NextResponse.json({ error: 'Pick a postcard design from the shop' }, { status: 400 })
  }

  const itemIds = [...surpriseItems.keys()]
  const { data: previous, error: previousError } = await service
    .from('surprise_picks')
    .select('product_id')
    .in('order_item_id', itemIds)
  if (previousError) {
    return NextResponse.json({ error: `Couldn’t load picks: ${previousError.message}. Has mystery-postcard.sql been run?` }, { status: 500 })
  }

  // Replace this order's picks with the new set
  const { error: deleteError } = await service.from('surprise_picks').delete().in('order_item_id', itemIds)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const rows = picks.map(p => ({
    order_item_id: p.itemId,
    slot: p.slot,
    product_id: p.productId,
    product_name: names.get(p.productId)!,
  }))
  const { data: saved, error: insertError } = rows.length
    ? await service.from('surprise_picks').insert(rows).select()
    : { data: [], error: null }
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Net stock change per design: new picks minus the ones they replace
  const delta = new Map<string, number>()
  for (const p of previous ?? []) delta.set(p.product_id, (delta.get(p.product_id) ?? 0) + 1)
  for (const p of picks) delta.set(p.productId, (delta.get(p.productId) ?? 0) - 1)
  await adjustStock(service, delta)

  return NextResponse.json({ picks: saved })
}
