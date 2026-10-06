// src/lib/format.ts

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

const DATE_FORMATS = {
  long: { year: 'numeric', month: 'long', day: 'numeric' },   // October 6, 2026
  short: { year: 'numeric', month: 'short', day: 'numeric' }, // Oct 6, 2026
  day: { month: 'short', day: 'numeric' },                    // Oct 6
} satisfies Record<string, Intl.DateTimeFormatOptions>

export function formatDate(date: string, style: keyof typeof DATE_FORMATS = 'long'): string {
  return new Date(date).toLocaleDateString('en-US', DATE_FORMATS[style])
}
