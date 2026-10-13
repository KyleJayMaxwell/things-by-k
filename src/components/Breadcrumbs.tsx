// src/components/Breadcrumbs.tsx

import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string   // the last crumb is the current page and has no link
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-secondary">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-text-primary transition-colors focus-ring rounded">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-primary truncate">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
