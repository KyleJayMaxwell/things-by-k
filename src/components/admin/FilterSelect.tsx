'use client'

// src/components/admin/FilterSelect.tsx
// Dropdown filter bound to one URL param; the empty option clears it

import { useListNav } from './useListNav'

interface FilterSelectProps {
  param: string
  label: string        // shown as the empty option, e.g. "All categories"
  options: { value: string; label: string }[]
}

export default function FilterSelect({ param, label, options }: FilterSelectProps) {
  const { setParams, searchParams } = useListNav()

  return (
    <select
      value={searchParams.get(param) ?? ''}
      onChange={e => setParams({ [param]: e.target.value || null })}
      aria-label={label}
      className="py-2 pl-3 pr-8 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
    >
      <option value="">{label}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}
