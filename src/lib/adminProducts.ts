// src/lib/adminProducts.ts
// Filters for the admin products table, shared by the page and its CSV export

import { escapeLike, parseListParams, readEnum, type SearchParams } from '@/lib/listParams'
import type { ProductCategory } from '@/types'

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = ['postcard', 'necklace', 'zine']
export const PRODUCT_SORTS = ['name', 'category', 'price', 'stock', 'is_active', 'created_at'] as const
export const PRODUCT_STATUSES = ['active', 'hidden'] as const
export const STOCK_LEVELS = ['in', 'low', 'out'] as const
export const ADMIN_PAGE_SIZES = [20, 50, 100] as const

// Stock at or below this (but above zero) counts as low
export const LOW_STOCK = 5

export type ProductSort = typeof PRODUCT_SORTS[number]

export function parseProductParams(params: SearchParams) {
  return {
    ...parseListParams(params, {
      sorts: PRODUCT_SORTS,
      defaultSort: 'created_at',
      defaultDir: 'desc',
      pageSizes: ADMIN_PAGE_SIZES,
    }),
    category: readEnum(params, 'category', PRODUCT_CATEGORIES),
    status: readEnum(params, 'status', PRODUCT_STATUSES),
    stock: readEnum(params, 'stock', STOCK_LEVELS),
  }
}

export type ProductParams = ReturnType<typeof parseProductParams>

// The few Supabase filter methods used here; each returns the same builder
interface Filterable {
  ilike(column: string, pattern: string): Filterable
  eq(column: string, value: unknown): Filterable
  gt(column: string, value: unknown): Filterable
  lte(column: string, value: unknown): Filterable
}

// Applies search, category, status and stock filters to a Supabase query (a select or a
// count). Pass `skip` to leave some out: the status tabs count across statuses.
export function applyProductFilters<T>(
  query: T,
  p: ProductParams,
  skip: { status?: boolean; stock?: boolean } = {}
): T {
  let q = query as unknown as Filterable
  if (p.q) q = q.ilike('name', `%${escapeLike(p.q)}%`)
  if (p.category) q = q.eq('category', p.category)
  if (p.status && !skip.status) q = q.eq('is_active', p.status === 'active')
  if (p.stock && !skip.stock) {
    if (p.stock === 'out') q = q.eq('stock', 0)
    if (p.stock === 'low') q = q.gt('stock', 0).lte('stock', LOW_STOCK)
    if (p.stock === 'in') q = q.gt('stock', 0)
  }
  return q as unknown as T
}
