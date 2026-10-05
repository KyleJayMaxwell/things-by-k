// src/lib/tracking.ts
// Carrier names + tracking links, shared by the shipping email and order pages

export type Carrier = 'usps' | 'ups' | 'fedex' | 'other'

export const CARRIER_NAMES: Record<Carrier, string> = {
  usps: 'USPS',
  ups: 'UPS',
  fedex: 'FedEx',
  other: 'Other',
}

export function trackingUrl(carrier: Carrier, trackingNumber: string): string | null {
  const n = encodeURIComponent(trackingNumber)
  switch (carrier) {
    case 'usps': return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`
    case 'ups': return `https://www.ups.com/track?tracknum=${n}`
    case 'fedex': return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    default: return null
  }
}
