// src/components/shop/ProductListing.tsx
// Shop grid with search, filter chips, sort, page size and page numbers.
// Everything lives in the URL, so the server only loads the page being shown.

import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import FadeIn from '@/components/FadeIn'
import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs'
import ListSelect from './ListSelect'
import LoadError from '@/components/LoadError'
import {
  PAGE_SIZES, DEFAULT_PAGE_SIZE, SORTS, ORIENTATIONS, listingHref,
  type ListingParams, type ListingResult, type SortKey,
} from '@/lib/productListing'
import type { ProductCategory, ProductOrientation } from '@/types'

interface ProductListingProps {
  title: string
  basePath: string
  params: ListingParams
  result: ListingResult
  breadcrumbs?: Crumb[]
  types?: { value: ProductCategory; label: string }[]   // Shop All type filter
  locations?: string[]
  showOrientation?: boolean
  searchPlaceholder?: string
}

export default function ProductListing({
  title, basePath, params, result, breadcrumbs, types, locations, showOrientation, searchPlaceholder = 'Search',
}: ProductListingProps) {
  const href = (changes: Partial<ListingParams>) => listingHref(basePath, params, changes)
  const { products, total, totalPages, failed } = result
  const hasFilters = !!(params.q || params.type || params.location || params.orientation)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-semibold text-text-primary">{title}</h1>
      </div>

      {/* Search: a plain GET form so it works before JavaScript loads */}
      <form action={basePath} method="get" role="search" className="mb-5 flex gap-2 max-w-md">
        <label htmlFor="shop-search" className="sr-only">Search products</label>
        <input
          id="shop-search"
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder={searchPlaceholder}
          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {params.type && <input type="hidden" name="type" value={params.type} />}
        {params.location && <input type="hidden" name="location" value={params.location} />}
        {params.orientation && <input type="hidden" name="orientation" value={params.orientation} />}
        {params.sort !== 'newest' && <input type="hidden" name="sort" value={params.sort} />}
        {params.per !== DEFAULT_PAGE_SIZE && <input type="hidden" name="per" value={params.per} />}
        <button type="submit" className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors focus-ring">
          Search
        </button>
      </form>

      {/* Filter chips */}
      <div className="space-y-3 mb-6">
        {types && types.length > 0 && (
          <ChipRow label="Type">
            <Chip href={href({ type: null })} active={!params.type}>All</Chip>
            {types.map(t => (
              <Chip key={t.value} href={href({ type: t.value })} active={params.type === t.value}>{t.label}</Chip>
            ))}
          </ChipRow>
        )}
        {locations && locations.length > 0 && (
          <ChipRow label="Location">
            <Chip href={href({ location: null })} active={!params.location}>All</Chip>
            {locations.map(loc => (
              <Chip key={loc} href={href({ location: loc })} active={params.location === loc}>{loc}</Chip>
            ))}
          </ChipRow>
        )}
        {showOrientation && (
          <ChipRow label="Orientation">
            <Chip href={href({ orientation: null })} active={!params.orientation}>All</Chip>
            {(Object.keys(ORIENTATIONS) as ProductOrientation[]).map(o => (
              <Chip key={o} href={href({ orientation: o })} active={params.orientation === o}>{ORIENTATIONS[o]}</Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {/* Count, sort and page size */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
        {/* The count is unknown when loading failed */}
        <p className={`text-sm text-text-secondary ${failed ? 'invisible' : ''}`}>
          {total} {total === 1 ? 'product' : 'products'}
          {hasFilters && (
            <>
              {' · '}
              <Link href={basePath} className="underline underline-offset-2 hover:text-botan focus-ring rounded">Clear filters</Link>
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <ListSelect
            label="Sort"
            value={params.sort}
            options={(Object.keys(SORTS) as SortKey[]).map(s => ({ value: s, label: SORTS[s], href: href({ sort: s }) }))}
          />
          <ListSelect
            label="Show"
            value={String(params.per)}
            options={PAGE_SIZES.map(n => ({ value: String(n), label: String(n), href: href({ per: n }) }))}
          />
        </div>
      </div>

      {/* Grid */}
      {failed ? (
        <LoadError message="We couldn’t load products just now. Please try again." />
      ) : products.length === 0 ? (
        <FadeIn>
          <div className="text-center py-20 text-text-secondary">
            {total > 0 ? (
              <p>There’s nothing on this page. <Link href={href({ page: 1 })} className="underline underline-offset-2 hover:text-botan">Go to page 1</Link></p>
            ) : hasFilters ? (
              <p>Nothing matches those filters. <Link href={basePath} className="underline underline-offset-2 hover:text-botan">Clear filters</Link></p>
            ) : (
              <p>No products available yet. Check back soon!</p>
            )}
          </div>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <FadeIn key={product.id} delay={i * 50}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      )}

      {totalPages > 1 && <Pagination page={params.page} totalPages={totalPages} hrefFor={p => href({ page: p })} />}
    </div>
  )
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-text-secondary w-24 flex-shrink-0">{label}</span>
      {children}
    </div>
  )
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'true' : undefined}
      className={`px-3 py-1 rounded-full border text-sm transition-colors focus-ring ${
        active
          ? 'bg-primary border-primary text-on-primary'
          : 'bg-surface border-border text-text-primary hover:border-text-secondary'
      }`}
    >
      {children}
    </Link>
  )
}

// Page numbers with the first, last and two either side of the current one
function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  const pages: (number | 'gap')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p)
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap')
  }
  const linkClass = 'min-w-9 h-9 px-2 inline-flex items-center justify-center rounded-lg text-sm transition-colors focus-ring'
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && <Link href={hrefFor(page - 1)} className={`${linkClass} text-text-primary hover:bg-primary-light`}>‹ Prev</Link>}
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-text-secondary">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${linkClass} ${p === page ? 'bg-primary text-on-primary' : 'text-text-primary hover:bg-primary-light'}`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && <Link href={hrefFor(page + 1)} className={`${linkClass} text-text-primary hover:bg-primary-light`}>Next ›</Link>}
    </nav>
  )
}
