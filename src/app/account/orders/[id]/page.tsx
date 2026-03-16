// src/app/account/orders/[id]/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Badge from '@/components/Badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Details' }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/account/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, product_name, price, quantity,
        products ( images, slug )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const address = order.shipping_address

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account/orders" className="text-text-secondary hover:text-primary transition-colors text-sm">
          ← Orders
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{order.order_number}</h1>
          <p className="text-text-secondary mt-1 text-sm">{formatDate(order.created_at)}</p>
        </div>
        <Badge status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-5 border-b border-border">
          <h2 className="font-medium text-text-primary">Items</h2>
        </div>
        <div className="divide-y divide-border">
          {order.order_items.map((item: {
            id: string
            product_name: string
            price: number
            quantity: number
            products: { images: string[]; slug: string } | null
          }) => (
            <div key={item.id} className="flex gap-4 p-5">
              {item.products?.images?.[0] && (
                <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-50 border border-border flex-shrink-0">
                  <Image
                    src={item.products.images[0]}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{item.product_name}</p>
                <p className="text-sm text-text-secondary mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium text-text-primary flex-shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment summary */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Shipping</span>
              <span>{formatPrice(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-border mt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Shipped To</h2>
          <address className="text-sm text-text-secondary not-italic leading-relaxed">
            {address.line1}<br />
            {address.line2 && <>{address.line2}<br /></>}
            {address.city}, {address.state} {address.postal_code}<br />
            {address.country}
          </address>
        </div>
      </div>
    </div>
  )
}
