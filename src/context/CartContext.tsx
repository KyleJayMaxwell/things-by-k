'use client'

// src/context/CartContext.tsx
// Global cart state. Persists to localStorage for guests.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { CartItem, Product } from '@/types'
import { cartLineKey, unitPrice } from '@/lib/cart'

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (product: Product, quantity?: number, options?: AddItemOptions) => void
  removeItem: (lineKey: string) => void
  updateQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
}

interface AddItemOptions {
  handwritten?: boolean
  message?: string
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_KEY = 'tbk_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      // localStorage only exists in the browser, so this has to wait for mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored))
    } catch {
      // ignore parse errors
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: Product, quantity = 1, options: AddItemOptions = {}) => {
    const line: CartItem = options.handwritten
      ? { product, quantity, handwritten: true, message: options.message?.trim() ?? '' }
      : { product, quantity }
    const key = cartLineKey(line)

    setItems(prev => {
      // Blank and handwritten lines share the product's stock
      const inOtherLines = prev
        .filter(i => i.product.id === product.id && cartLineKey(i) !== key)
        .reduce((sum, i) => sum + i.quantity, 0)
      const available = Math.max(product.stock - inOtherLines, 0)

      const existing = prev.find(i => cartLineKey(i) === key)
      if (existing) {
        return prev.map(i =>
          cartLineKey(i) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, available) }
            : i
        )
      }
      if (available === 0) return prev
      return [...prev, { ...line, quantity: Math.min(quantity, available) }]
    })
  }, [])

  const removeItem = useCallback((lineKey: string) => {
    setItems(prev => prev.filter(i => cartLineKey(i) !== lineKey))
  }, [])

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => cartLineKey(i) !== lineKey))
    } else {
      setItems(prev =>
        prev.map(i => cartLineKey(i) === lineKey ? { ...i, quantity } : i)
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(CART_KEY)
  }, [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
