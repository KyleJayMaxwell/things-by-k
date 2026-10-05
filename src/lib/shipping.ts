// src/lib/shipping.ts
// Delivery wording for untracked mail — edit the weeks here to change the email.

export type Destination = 'domestic' | 'international'

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
