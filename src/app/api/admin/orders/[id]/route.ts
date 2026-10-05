// src/app/api/admin/orders/[id]/route.ts
// Admin-only: update an order's status and tracking.
// Sends the customer a shipping email when an order moves to "shipped".

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { sendShippingUpdate } from '@/lib/email'
import type { Carrier } from '@/lib/tracking'

const STATUSES = ['processing', 'shipped', 'delivered'] as const
const CARRIERS: Carrier[] = ['usps', 'ups', 'fedex', 'other']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = body?.status
  const carrier: Carrier | null = CARRIERS.includes(body?.carrier) ? body.carrier : null
  const trackingNumber: string | null =
    typeof body?.trackingNumber === 'string' && body.trackingNumber.trim()
      ? body.trackingNumber.trim()
      : null
  const notify = body?.notify !== false

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: existing, error: fetchError } = await service
    .from('orders')
    .select('id, status, email, order_number, shipping_address, shipped_at, order_items(product_name, price, quantity)')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const isNewlyShipped = status === 'shipped' && existing.status !== 'shipped'

  const { data: order, error: updateError } = await service
    .from('orders')
    .update({
      status,
      carrier: trackingNumber ? carrier : null,
      tracking_number: trackingNumber,
      shipped_at: isNewlyShipped ? new Date().toISOString() : existing.shipped_at,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // The status change is saved either way; report email problems separately
  let emailSent = false
  let emailError: string | null = null

  if (isNewlyShipped && notify && existing.email) {
    try {
      await sendShippingUpdate({
        to: existing.email,
        orderNumber: existing.order_number,
        recipientName: existing.shipping_address?.name,
        items: (existing.order_items ?? []).map((i: { product_name: string; price: number; quantity: number }) => ({
          name: i.product_name,
          price: i.price,
          quantity: i.quantity,
        })),
        carrier: trackingNumber ? carrier : null,
        trackingNumber,
      })
      emailSent = true
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Email send failed'
    }
  }

  return NextResponse.json({ order, emailSent, emailError })
}
