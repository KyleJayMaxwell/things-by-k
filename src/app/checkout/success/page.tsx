'use client'

// src/app/checkout/success/page.tsx

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Button from '@/components/Button'

interface OrderDetails {
  customerEmail?: string
  shippingAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  lineItems?: { name: string; quantity: number; amount: number }[]
  amountSubtotal?: number
  shippingCost?: number
  amountTotal?: number
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCart()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clearCart()
    if (!sessionId) { setLoading(false); return }

    fetch(`/api/orders/${sessionId}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId, clearCart])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-success" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>

      <h1 className="text-3xl font-semibold text-text-primary mb-2">Thank you for your order!</h1>
      <p className="text-text-secondary mb-10">
        We'll get it packed up and on its way soon.
      </p>

      {/* Order details */}
      {loading ? (
        <div className="text-text-secondary">Loading order details...</div>
      ) : order && !('error' in order) ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-left space-y-6">

          {/* Items */}
          {order.lineItems && order.lineItems.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Items</h2>
              <div className="space-y-2">
                {order.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{item.name} × {item.quantity}</span>
                    <span className="text-text-primary">{formatPrice(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          {order.amountTotal && (
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              {order.amountSubtotal && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span>{formatPrice(order.amountSubtotal)}</span>
                </div>
              )}
              {order.shippingCost !== undefined && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatPrice(order.amountTotal)}</span>
              </div>
            </div>
          )}

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-2">Shipping to</h2>
              <address className="text-sm text-text-secondary not-italic">
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
              </address>
            </div>
          )}
        </div>
      ) : null}

      {/* CTAs */}
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Button as={Link} href="/account/orders" variant="secondary" size="lg">
          View Orders
        </Button>
        <Button as={Link} href="/shop" variant="primary" size="lg">
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
