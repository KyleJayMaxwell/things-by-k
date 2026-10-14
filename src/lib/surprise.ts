// src/lib/surprise.ts
// Helpers for the Mystery postcard: the buyer gets one of the shop's
// designs without knowing which, and the admin picks it when packing.

import type { ShippingAddress } from '@/types'

// Longest "any preference?" note a buyer can leave
export const SURPRISE_PREFERENCE_MAX = 300

// One key per mailing address, so a recipient never gets the same design twice
// even across different buyers. Ignores case, spacing and punctuation.
export function addressKey(address: Partial<ShippingAddress> | null | undefined): string {
  if (!address?.line1) return ''
  const clean = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return [address.line1, address.line2, address.postal_code, address.country].map(clean).join('|')
}

// Wording for the Stripe line item and order confirmation
export function surpriseSummary(options: { preference?: string; gift?: boolean; sameDesign?: boolean }): string {
  const parts = [
    options.gift ? 'Gift' : null,
    options.sameDesign ? 'All the same design' : null,
    options.preference ? `Preference: ${options.preference}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}
