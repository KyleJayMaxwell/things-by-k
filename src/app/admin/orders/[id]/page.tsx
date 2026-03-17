'use client'

// src/app/admin/orders/[id]/page.tsx

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const STATUS_OPTIONS = ['processing', 'shipped', 'delivered'] as const
type OrderStatus = typeof STATUS_OPTIONS[number]

const statusStyles: Record<OrderStatus, string> = {
  processing: 'bg-primary-light text-primary',
  shipped: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<OrderStatus>('processing')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select(`*, order_items(id, product_name, price, quantity)`)
        .eq('id', id)
        .single()

      if (data) {
        setOrder(data)
        setStatus(data.status)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('orders').update({ status }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOrder((prev: any) => ({ ...prev, status }))
  }

  if (loading) return <div className="text-text-secondary text-sm">Loading...</div>
  if (!order) return <div className="text-text-secondary text-sm">Order not found.</div>

  const address = order.shipping_address

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/orders" className="text-sm text-text-secondary hover:text-primary transition-colors">
          ← Orders
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{order.order_number}</h1>
          <p className="text-text-secondary text-sm mt-1">{formatDate(order.created_at)} · {order.email}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[status as OrderStatus]}`}>
          {status}
        </span>
      </div>

      {/* Status update */}
      <div className="bg-white border border-border rounded-xl p-5 mb-6">
        <h2 className="font-medium text-text-primary mb-4">Update Status</h2>
        <div className="flex items-center gap-3">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                status === s
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary/40 hover:text-text-primary'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={handleSave}
            disabled={saving || status === order.status}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium text-text-primary">Items</h2>
        </div>
        <div className="divide-y divide-border">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-text-primary">{item.product_name}</p>
                <p className="text-xs text-text-secondary mt-0.5">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-text-primary">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment summary */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Payment</h2>
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
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Ship To</h2>
          {address ? (
            <address className="text-sm text-text-secondary not-italic leading-relaxed">
              {address.line1}<br />
              {address.line2 && <>{address.line2}<br /></>}
              {address.city}, {address.state} {address.postal_code}<br />
              {address.country}
            </address>
          ) : (
            <p className="text-sm text-text-secondary">No address recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
