// src/components/admin/StatusTabs.tsx
// Row of tabs with counts that set one or more URL params

import Link from 'next/link'
import { listHref, type SearchParams } from '@/lib/listParams'

export interface StatusTab {
  label: string
  count: number | null
  changes: Record<string, string | null>  // params this tab sets (null clears)
  active: boolean
}

export default function StatusTabs({ tabs, pathname, params }: { tabs: StatusTab[]; pathname: string; params: SearchParams }) {
  return (
    <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-border mb-4">
      {tabs.map(tab => (
        <Link
          key={tab.label}
          href={listHref(pathname, params, tab.changes)}
          scroll={false}
        prefetch={false}
          aria-current={tab.active ? 'page' : undefined}
          className={`whitespace-nowrap px-3 py-2 -mb-px text-sm border-b-2 transition-colors ${
            tab.active
              ? 'border-neutral-900 text-text-primary font-medium'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab.label}
          {tab.count !== null && (
            <span className={`ml-1.5 text-xs ${tab.active ? 'text-text-primary' : 'text-text-secondary'}`}>{tab.count}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}
