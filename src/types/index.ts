// src/types/index.ts
// Shared TypeScript types — mirrors the Supabase schema from the PRD

// ── Products ──────────────────────────────────────────────────────────────────

export type ProductCategory = 'postcard' | 'necklace' | 'zine'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  long_description: string
  price: number          // in cents
  currency: string       // 'usd'
  category: ProductCategory
  images: string[]       // Supabase Storage URLs
  stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'processing' | 'shipped' | 'delivered'

export interface ShippingAddress {
  line1: string
  line2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string | null
  email: string
  stripe_session_id: string
  stripe_payment_intent: string
  status: OrderStatus
  subtotal: number       // in cents
  shipping_cost: number  // in cents
  total: number          // in cents
  shipping_address: ShippingAddress
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string   // snapshot at time of purchase
  price: number          // snapshot in cents
  quantity: number
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  first_name: string
  created_at: string
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  items: CartItem[]
}
