// src/lib/productListing.ts
// Server-side shop listing: reads filters, sort and page from the URL and asks
// Supabase for just that page of products, plus the total for page numbers.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product, ProductCategory, ProductOrientation } from '@/types'
import { readParam, readEnum, pageCount, type SearchParams } from '@/lib/listParams'

export const PAGE_SIZES = [12, 24, 48] as const
export const DEFAULT_PAGE_SIZE = 24

export const SORTS = {
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  name: 'Name: A to Z',
} as const
export type SortKey = keyof typeof SORTS

export const ORIENTATIONS: Record<ProductOrientation, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
}

export interface ListingParams {
  page: number
  per: number
  sort: SortKey
  q: string
  location: string | null
  orientation: ProductOrientation | null
  type: ProductCategory | null   // Shop All only
}

export type RawSearchParams = SearchParams

export function parseListingParams(raw: RawSearchParams, categories: readonly ProductCategory[] = []): ListingParams {
  const page = Number(readParam(raw, 'page'))
  const per = Number(readParam(raw, 'per'))
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    per: (PAGE_SIZES as readonly number[]).includes(per) ? per : DEFAULT_PAGE_SIZE,
    sort: readEnum(raw, 'sort', Object.keys(SORTS) as SortKey[]) ?? 'newest',
    q: (readParam(raw, 'q') ?? '').trim().slice(0, 100),
    location: readParam(raw, 'location')?.trim() || null,
    orientation: readEnum(raw, 'orientation', Object.keys(ORIENTATIONS) as ProductOrientation[]) ?? null,
    type: readEnum(raw, 'type', categories) ?? null,
  }
}

// Builds a URL for the same listing with some params changed. Changing anything
// but the page sends the shopper back to page 1. Defaults are left out.
export function listingHref(basePath: string, params: ListingParams, changes: Partial<ListingParams>): string {
  const next = { ...params, ...changes }
  if (!('page' in changes)) next.page = 1
  const sp = new URLSearchParams()
  if (next.q) sp.set('q', next.q)
  if (next.type) sp.set('type', next.type)
  if (next.location) sp.set('location', next.location)
  if (next.orientation) sp.set('orientation', next.orientation)
  if (next.sort !== 'newest') sp.set('sort', next.sort)
  if (next.per !== DEFAULT_PAGE_SIZE) sp.set('per', String(next.per))
  if (next.page > 1) sp.set('page', String(next.page))
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export interface ListingResult {
  products: Product[]
  total: number
  totalPages: number
  // True when the products couldn't be loaded, so the page doesn't claim there are none
  failed: boolean
}

export async function fetchProductPage(
  supabase: SupabaseClient,
  params: ListingParams,
  { category }: { category?: ProductCategory } = {},
): Promise<ListingResult> {
  const from = (params.page - 1) * params.per
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  const cat = category ?? params.type
  if (cat) query = query.eq('category', cat)
  if (params.location) query = query.contains('locations', [params.location])
  if (params.orientation) query = query.eq('orientation', params.orientation)

  // Every word has to appear somewhere in the name, descriptions or locations
  const words = params.q.toLowerCase().replace(/[%_*,()\\]/g, ' ').split(/\s+/).filter(Boolean)
  for (const word of words) query = query.ilike('search_text', `%${word}%`)

  switch (params.sort) {
    case 'price-asc': query = query.order('price', { ascending: true }); break
    case 'price-desc': query = query.order('price', { ascending: false }); break
    case 'name': query = query.order('name', { ascending: true }); break
    default: query = query.order('created_at', { ascending: false })
  }
  // Tiebreaker so products don't swap between pages
  query = query.order('id', { ascending: true })

  const { data, count, error } = await query.range(from, from + params.per - 1)

  // Asking for a page past the end comes back as a range error; treat it as empty
  const failed = !!error && error.code !== 'PGRST103'
  if (failed) console.error('Failed to fetch products:', error)

  const total = count ?? 0
  return {
    products: (data as Product[] | null) ?? [],
    total,
    totalPages: pageCount(total, params.per),
    failed,
  }
}

// Every location tag in use, for the filter chips
export async function fetchLocations(supabase: SupabaseClient, category?: ProductCategory): Promise<string[]> {
  let query = supabase.from('products').select('locations').eq('is_active', true)
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch locations:', error)
    return []
  }
  const all = new Set<string>()
  for (const row of data ?? []) for (const loc of (row.locations as string[] | null) ?? []) all.add(loc)
  return [...all].sort((a, b) => a.localeCompare(b))
}

// Categories that have at least one product on sale, for the Shop All type filter
export async function fetchActiveCategories(supabase: SupabaseClient): Promise<ProductCategory[]> {
  const { data, error } = await supabase.from('products').select('category').eq('is_active', true)
  if (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
  return [...new Set((data ?? []).map(r => r.category as ProductCategory))]
}
