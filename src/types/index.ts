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
  handwritten_price: number | null  // extra cents for a handwritten postcard; null = no extra
  is_surprise?: boolean  // the Surprise me listing: the admin picks the design when packing
  created_at: string
  updated_at: string
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'refunded'

export interface ShippingAddress {
  name?: string
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
  carrier: 'usps' | 'ups' | 'fedex' | 'other' | null
  tracking_number: string | null
  shipped_at: string | null
  refunded_at: string | null
  refund_amount: number | null  // in cents
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string   // snapshot at time of purchase
  price: number          // snapshot in cents
  quantity: number
  handwritten_message: string | null
  surprise_preference?: string | null  // Surprise me: optional "any preference?" note
  is_gift?: boolean                    // Surprise me: shipped email names the design
  same_design?: boolean                // Surprise me: every card in this line is one design
}

// The design sent for one card of a Surprise me item (admin-only table)
export interface SurprisePick {
  id: string
  order_item_id: string
  slot: number           // 0 .. quantity - 1
  product_id: string
  product_name: string   // snapshot
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
  handwritten?: boolean
  message?: string       // what to write on a handwritten card
  surprise?: SurpriseOptions  // only on a Surprise me card
}

export interface SurpriseOptions {
  preference: string     // optional; '' for none
  gift: boolean
  sameDesign: boolean    // only meaningful when quantity > 1
}

export interface Cart {
  items: CartItem[]
}
