'use client'

// src/components/shop/ListSelect.tsx
// Sort and page-size dropdowns; each option already knows the URL it leads to

import { useRouter } from 'next/navigation'

export default function ListSelect({ label, value, options }: {
  label: string
  value: string
  options: { value: string; label: string; href: string }[]
}) {
  const router = useRouter()
  const id = `list-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-text-secondary">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={e => {
          const option = options.find(o => o.value === e.target.value)
          if (option) router.push(option.href, { scroll: false })
        }}
        className="px-2.5 py-1.5 border border-border rounded-lg bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}
