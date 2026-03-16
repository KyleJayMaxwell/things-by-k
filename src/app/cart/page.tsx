'use client'

// src/app/cart/page.tsx

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import CartItem from '@/components/CartItem'
import Button from '@/components/Button'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'

const SHIPPING_COST = 300 // $3.00 flat rate in cents

export default function CartPage() {
  const { items, subtotal } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const total = subtotal + SHIPPING_COST

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-2">Your cart is empty</h1>
        <p className="text-text-secondary mb-8">Looks like you haven't added anything yet.</p>
        <Link href="/shop">
          <Button variant="primary" size="lg">
            Shop Now
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-text-primary mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {items.map(item => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-text-primary mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping</span>
                <span className="text-text-primary">{formatPrice(SHIPPING_COST)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-semibold text-base">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="mt-6"
              loading={loading}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>

            {error && (
              <p role="alert" className="mt-3 text-sm text-error text-center">{error}</p>
            )}

            <Link
              href="/shop"
              className="block text-center mt-4 text-sm text-text-secondary hover:text-primary transition-colors focus-ring rounded"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
