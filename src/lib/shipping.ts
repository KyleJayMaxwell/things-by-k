// src/lib/shipping.ts
// Shipping prices and delivery wording — edit the numbers here to change rates.
// Shared by the cart (estimate), checkout (Stripe shipping) and the shipped email.

export type Destination = 'domestic' | 'international'

// Handwritten postcards go out on their own, stamped, with no envelope.
// Charged per card, in cents — enough to cover one postcard stamp.
export const HANDWRITTEN_POSTCARD_RATES: Record<Destination, number> = {
  domestic: 100,
  international: 200,
}

// Everything else (blank postcards and other goods) ships together in a padded
// envelope or box. Charged once per order, in cents.
// PLACEHOLDER: set these to cover the packaging plus postage.
export const PACKAGED_RATES: Record<Destination, number> = {
  domestic: 500,
  international: 1500,
}

// Countries offered when the customer picks "International" in the cart
export const INTERNATIONAL_COUNTRIES = [
  'CA', 'MX', 'GB', 'IE', 'FR', 'DE', 'NL', 'BE', 'LU', 'ES', 'PT', 'IT', 'AT', 'CH',
  'DK', 'SE', 'NO', 'FI', 'IS', 'PL', 'CZ', 'GR', 'AU', 'NZ', 'JP', 'KR', 'SG', 'HK', 'TW',
] as const

export interface ShippingQuote {
  amount: number   // cents
  label: string
}

// handwrittenCards: number of handwritten postcards in the order
// packagedItems: number of other units (blank postcards, necklaces, zines)
export function shippingQuote(destination: Destination, handwrittenCards: number, packagedItems: number): ShippingQuote {
  const postcardMail = handwrittenCards * HANDWRITTEN_POSTCARD_RATES[destination]
  const packaged = packagedItems > 0 ? PACKAGED_RATES[destination] : 0
  const label =
    handwrittenCards > 0 && packagedItems > 0 ? 'Postcard mail + packaged shipping'
    : handwrittenCards > 0 ? 'Postcard mail (no envelope)'
    : 'Packaged shipping'
  return { amount: postcardMail + packaged, label }
}

// Untracked mail: if it hasn't arrived this many weeks after the shipped
// email, the customer is told to reach out for a replacement
export const DELIVERY_WEEKS: Record<Destination, number> = {
  domestic: 2,
  international: 4,
}

export function destinationForCountry(country: string | null | undefined): Destination {
  return !country || country === 'US' ? 'domestic' : 'international'
}

export function untrackedMailNote(destination: Destination): string {
  const weeks = DELIVERY_WEEKS[destination]
  const where = destination === 'domestic' ? 'Mail within the US' : 'International mail'
  return `It went out by regular mail without tracking. ${where} usually arrives within ${weeks} weeks. ` +
    `If it hasn't reached you ${weeks} weeks from this email, just reply and I'll send another one out.`
}
