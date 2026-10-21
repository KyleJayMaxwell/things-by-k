'use client'

// src/components/admin/PageSizeSelect.tsx

import { useListNav } from './useListNav'

export default function PageSizeSelect({ sizes, perPage }: { sizes: readonly number[]; perPage: number }) {
  const { setParams } = useListNav()

  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary">
      Rows
      <select
        value={perPage}
        onChange={e => setParams({ per: Number(e.target.value) === sizes[0] ? null : e.target.value })}
        className="py-1.5 pl-2 pr-7 text-sm bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
      >
        {sizes.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </label>
  )
}
