// src/app/admin/orders/page.tsx

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const statusStyles: Record<string, string> = {
  processing: 'bg-primary-light text-primary',
  shipped: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/')

  const serviceClient = createServiceClient()
  const { data: orders } = await serviceClient
    .from('orders')
    .select('id, order_number, email, total, status, created_at, order_items(id)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Orders</h1>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {!orders || orders.length === 0 ? (
          <p className="text-text-secondary text-sm px-6 py-12 text-center">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-text-secondary uppercase tracking-wider">
              <span className="col-span-2">Order</span>
              <span className="col-span-4">Customer</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1 text-right">Items</span>
              <span className="col-span-1 text-right">Total</span>
            </div>
            {orders.map(order => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="grid grid-cols-12 px-5 py-4 hover:bg-gray-50 transition-colors group items-center"
              >
                <span className="col-span-2 text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                  {order.order_number}
                </span>
                <span className="col-span-4 text-sm text-text-secondary truncate pr-4">{order.email}</span>
                <span className="col-span-2 text-sm text-text-secondary">{formatDate(order.created_at)}</span>
                <span className="col-span-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </span>
                <span className="col-span-1 text-sm text-text-secondary text-right">
                  {(order.order_items as { id: string }[]).length}
                </span>
                <span className="col-span-1 text-sm font-medium text-text-primary text-right">
                  {formatPrice(order.total)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
