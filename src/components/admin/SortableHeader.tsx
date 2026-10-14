// src/components/admin/SortableHeader.tsx
// Table header that sorts the list on the server. First click sorts by the column
// (in its natural direction), the next click flips it.

import Link from 'next/link'
import { listHref, type SearchParams, type SortDir } from '@/lib/listParams'

interface SortableHeaderProps {
  label: string
  column: string
  sort: string
  dir: SortDir
  pathname: string
  params: SearchParams
  firstDir?: SortDir   // direction on first click: 'asc' for text, 'desc' for dates and numbers
  align?: 'left' | 'right'
  className?: string
}

export default function SortableHeader({
  label, column, sort, dir, pathname, params, firstDir = 'asc', align = 'left', className = '',
}: SortableHeaderProps) {
  const active = sort === column
  const nextDir: SortDir = active ? (dir === 'asc' ? 'desc' : 'asc') : firstDir
  const href = listHref(pathname, params, { sort: column, dir: nextDir })

  return (
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-3 font-normal ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}
    >
      <Link
        href={href}
        scroll={false}
        className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-text-primary transition-colors ${
          active ? 'text-text-primary font-medium' : ''
        }`}
      >
        {label}
        <span aria-hidden="true" className={`text-[10px] ${active ? '' : 'opacity-30'}`}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '▲▼'}
        </span>
      </Link>
    </th>
  )
}
