// src/lib/cart.ts
// Helpers shared by the cart, product page and checkout

import { CartItem } from '@/types'

// Longest note a customer can ask to have handwritten on a postcard
export const HANDWRITTEN_MESSAGE_MAX = 300

// A cart line is one product + option + note, so the same postcard can be in
// the cart blank and handwritten (or with two different notes) at once
export function cartLineKey(item: Pick<CartItem, 'product' | 'handwritten' | 'message'>): string {
  return item.handwritten ? `${item.product.id}:hw:${item.message ?? ''}` : item.product.id
}

export function unitPrice(item: Pick<CartItem, 'product' | 'handwritten'>): number {
  return item.product.price + (item.handwritten ? item.product.handwritten_price ?? 0 : 0)
}
