// src/components/admin/Pagination.tsx
// "Showing 21–40 of 87", rows-per-page picker, and page links

import Link from 'next/link'
import { listHref, pageCount, type SearchParams } from '@/lib/listParams'
import PageSizeSelect from './PageSizeSelect'

interface PaginationProps {
  page: number
  perPage: number
  total: number
  pageSizes: readonly number[]
  pathname: string
  params: SearchParams
}

// Page numbers to show: first, last, and two either side of the current page
function visiblePages(page: number, last: number): (number | 'gap')[] {
  const pages: (number | 'gap')[] = []
  for (let n = 1; n <= last; n++) {
    if (n === 1 || n === last || Math.abs(n - page) <= 2) pages.push(n)
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap')
  }
  return pages
}

export default function Pagination({ page, perPage, total, pageSizes, pathname, params }: PaginationProps) {
  const last = pageCount(total, perPage)
  const first = total === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)
  const href = (n: number) => listHref(pathname, params, { page: String(n) })

  const linkClass = 'min-w-8 h-8 px-2 inline-flex items-center justify-center rounded-lg text-sm transition-colors'

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-border">
      <div className="flex items-center gap-4">
        <p className="text-sm text-text-secondary">
          {total === 0 ? 'No results' : `Showing ${first}–${end} of ${total}`}
        </p>
        <PageSizeSelect sizes={pageSizes} perPage={perPage} />
      </div>

      {last > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} scroll={false} prefetch={false} className={`${linkClass} text-text-secondary hover:bg-gray-100`}>
              ← Prev
            </Link>
          ) : (
            <span className={`${linkClass} text-text-secondary opacity-40`}>← Prev</span>
          )}
          {visiblePages(page, last).map((n, i) =>
            n === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-text-secondary">…</span>
            ) : (
              <Link
                key={n}
                href={href(n)}
                scroll={false}
                prefetch={false}
                aria-current={n === page ? 'page' : undefined}
                className={`${linkClass} ${n === page ? 'bg-neutral-900 text-white' : 'text-text-primary hover:bg-gray-100'}`}
              >
                {n}
              </Link>
            )
          )}
          {page < last ? (
            <Link href={href(page + 1)} scroll={false} prefetch={false} className={`${linkClass} text-text-secondary hover:bg-gray-100`}>
              Next →
            </Link>
          ) : (
            <span className={`${linkClass} text-text-secondary opacity-40`}>Next →</span>
          )}
        </nav>
      )}
    </div>
  )
}
