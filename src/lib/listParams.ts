// src/lib/listParams.ts
// Reads table/grid state (page, page size, sort, search) from URL search params.
// Shared by the admin tables and the shop grid so every list pages on the server
// with Supabase .range() plus an exact count.

export type SearchParams = Record<string, string | string[] | undefined>

export type SortDir = 'asc' | 'desc'

export interface ListOptions<S extends string> {
  sorts: readonly S[]      // allow-list of sortable columns
  defaultSort: S
  defaultDir: SortDir
  pageSizes: readonly number[]
}

export interface ListParams<S extends string> {
  page: number     // 1-based
  perPage: number
  sort: S
  dir: SortDir
  q: string        // trimmed search text, '' when none
  from: number     // first row index for .range()
  to: number       // last row index (inclusive) for .range()
}

// First value of a param, or undefined
export function readParam(params: SearchParams, key: string): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

// Returns the param only if it's one of the allowed values
export function readEnum<T extends string>(params: SearchParams, key: string, allowed: readonly T[]): T | undefined {
  const value = readParam(params, key)
  return allowed.includes(value as T) ? (value as T) : undefined
}

export function parseListParams<S extends string>(params: SearchParams, options: ListOptions<S>): ListParams<S> {
  const sort = readEnum(params, 'sort', options.sorts) ?? options.defaultSort
  const dirParam = readParam(params, 'dir')
  const dir: SortDir = dirParam === 'asc' || dirParam === 'desc' ? dirParam : options.defaultDir

  const perParam = Number(readParam(params, 'per'))
  const perPage = options.pageSizes.includes(perParam) ? perParam : options.pageSizes[0]

  const pageParam = Number(readParam(params, 'page'))
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1

  const q = (readParam(params, 'q') ?? '').trim().slice(0, 100)
  const from = (page - 1) * perPage

  return { page, perPage, sort, dir, q, from, to: from + perPage - 1 }
}

export function pageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage))
}

// Escapes the wildcard characters of a LIKE pattern so search text matches literally
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, char => `\\${char}`)
}

// Builds a URL with some params changed; null removes a param.
// Anything other than a page change sends the list back to page 1.
export function listHref(pathname: string, params: SearchParams, changes: Record<string, string | null>): string {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value
    if (first !== undefined && first !== '') next.set(key, first)
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key)
    else next.set(key, value)
  }
  if (!('page' in changes)) next.delete('page')
  if (next.get('page') === '1') next.delete('page')

  const query = next.toString()
  return query ? `${pathname}?${query}` : pathname
}
