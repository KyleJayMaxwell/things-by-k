// src/lib/adminOrders.ts
// Filters for the admin orders table, shared by the page and its CSV export

import { parseListParams, readEnum, readParam, type SearchParams } from '@/lib/listParams'
import type { OrderStatus } from '@/types'
import { ADMIN_PAGE_SIZES } from '@/lib/adminProducts'

export const ORDER_STATUSES: readonly OrderStatus[] = ['processing', 'shipped', 'delivered', 'refunded']
export const ORDER_SORTS = ['created_at', 'order_number', 'email', 'status', 'total'] as const

// "A day" in the admin means a day in the shop's own time zone, not the server's (UTC)
export const SHOP_TIME_ZONE = 'America/Los_Angeles'

// Unshipped orders older than this get a warning
export const SHIP_WARNING_DAYS = 3

// Whole days since an ISO timestamp
export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000))
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseOrderParams(params: SearchParams) {
  const day = readParam(params, 'day')
  return {
    ...parseListParams(params, {
      sorts: ORDER_SORTS,
      defaultSort: 'created_at',
      defaultDir: 'desc',
      pageSizes: ADMIN_PAGE_SIZES,
    }),
    status: readEnum(params, 'status', ORDER_STATUSES),
    day: day && DAY_PATTERN.test(day) && !Number.isNaN(Date.parse(day)) ? day : undefined,
  }
}

export type OrderParams = ReturnType<typeof parseOrderParams>

// Offset of a time zone from UTC at a given instant, in milliseconds
function zoneOffset(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instant).map(p => [p.type, p.value])
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return asUtc - Math.floor(instant / 1000) * 1000
}

// Midnight at the start of a YYYY-MM-DD day in the shop's time zone, as a UTC instant
function zonedMidnight(y: number, m: number, d: number): number {
  const guess = Date.UTC(y, m - 1, d)
  const first = guess - zoneOffset(guess, SHOP_TIME_ZONE)
  // Re-check in case the guess and the answer straddle a daylight-saving change
  return guess - zoneOffset(first, SHOP_TIME_ZONE)
}

// Start (inclusive) and end (exclusive) of a shop-time day, as ISO strings
export function shopDayBounds(day: string): { start: string; end: string } {
  const [y, m, d] = day.split('-').map(Number)
  return {
    start: new Date(zonedMidnight(y, m, d)).toISOString(),
    end: new Date(zonedMidnight(y, m, d + 1)).toISOString(),
  }
}

// Today's date (YYYY-MM-DD) in the shop's time zone
export function shopToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE }).format(new Date())
}

// The few Supabase filter methods used here; each returns the same builder
interface Filterable {
  or(filters: string): Filterable
  eq(column: string, value: unknown): Filterable
  gte(column: string, value: unknown): Filterable
  lt(column: string, value: unknown): Filterable
}

// Applies search, status and day filters to a Supabase query (a select or a count).
// Pass `skip.status` for the status tab counts.
export function applyOrderFilters<T>(query: T, p: OrderParams, skip: { status?: boolean } = {}): T {
  let q = query as unknown as Filterable
  if (p.q) {
    // Characters that would break PostgREST's or() syntax or act as wildcards are dropped
    const term = p.q.replace(/[,()"\\%*]/g, '').trim()
    if (term) {
      q = q.or([
        `order_number.ilike.%${term}%`,
        `email.ilike.%${term}%`,
        `shipping_address->>name.ilike.%${term}%`,
        `tracking_number.ilike.%${term}%`,
      ].join(','))
    }
  }
  if (p.status && !skip.status) q = q.eq('status', p.status)
  if (p.day) {
    const { start, end } = shopDayBounds(p.day)
    q = q.gte('created_at', start).lt('created_at', end)
  }
  return q as unknown as T
}
