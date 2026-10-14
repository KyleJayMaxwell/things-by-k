// src/app/api/admin/orders/export/route.ts
// Admin-only: CSV of every order matching the table's current search, filters and sort

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { SHOP_TIME_ZONE, applyOrderFilters, parseOrderParams } from '@/lib/adminOrders'
import { csvResponse, toCsv } from '@/lib/csv'

const MAX_ROWS = 5000

const dollars = (cents: number | null) => (cents == null ? '' : (cents / 100).toFixed(2))

// "2026-10-13 14:05" in the shop's time zone
const shopTime = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('sv-SE', {
        timeZone: SHOP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).format(new Date(iso))
    : ''

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const p = parseOrderParams(Object.fromEntries(request.nextUrl.searchParams))
  const { data, error } = await applyOrderFilters(
    createServiceClient()
      .from('orders')
      .select(
        'order_number, created_at, status, email, shipping_address, subtotal, shipping_cost, total, refund_amount, carrier, tracking_number, shipped_at, order_items(product_name, quantity, handwritten_message)'
      ),
    p
  )
    .order(p.sort, { ascending: p.dir === 'asc' })
    .order('id')
    .limit(MAX_ROWS)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = toCsv(
    [
      'Order', 'Date (Pacific)', 'Status', 'Customer', 'Email', 'City', 'State', 'Country', 'Items', 'Handwritten',
      'Subtotal', 'Shipping', 'Total', 'Refunded', 'Carrier', 'Tracking', 'Shipped (Pacific)',
    ],
    (data ?? []).map(order => {
      const items: { product_name: string; quantity: number; handwritten_message: string | null }[] = order.order_items ?? []
      return [
        order.order_number,
        shopTime(order.created_at),
        order.status,
        order.shipping_address?.name ?? '',
        order.email,
        order.shipping_address?.city ?? '',
        order.shipping_address?.state ?? '',
        order.shipping_address?.country ?? '',
        items.map(item => `${item.quantity} × ${item.product_name}`).join('; '),
        items.some(item => item.handwritten_message) ? 'Yes' : '',
        dollars(order.subtotal),
        dollars(order.shipping_cost),
        dollars(order.total),
        dollars(order.refund_amount),
        order.carrier ?? '',
        order.tracking_number ?? '',
        shopTime(order.shipped_at),
      ]
    })
  )

  return csvResponse(csv, `orders-${new Date().toISOString().slice(0, 10)}.csv`)
}
