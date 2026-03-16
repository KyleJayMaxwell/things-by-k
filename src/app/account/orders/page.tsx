// src/app/account/orders/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Badge from '@/components/Badge'
import { Order } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order History' }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/account/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-text-secondary hover:text-primary transition-colors">
          ← Account
        </Link>
        <h1 className="text-3xl font-semibold text-text-primary">Order History</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary mb-6">You haven't placed any orders yet.</p>
          <Link href="/shop" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: Order & { order_items: { id: string }[] }) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary group-hover:text-primary transition-colors">
                    {order.order_number}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">
                    {formatDate(order.created_at)} · {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge status={order.status} />
                  <span className="font-medium text-text-primary">{formatPrice(order.total)}</span>
                  <svg className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
