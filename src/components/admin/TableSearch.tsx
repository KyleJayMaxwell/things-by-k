'use client'

// src/components/admin/TableSearch.tsx
// Search box that waits for a pause in typing, then updates ?q= (the server does the search)

import { useEffect, useRef, useState } from 'react'
import Spinner from '@/components/Spinner'
import { useListNav } from './useListNav'

const DEBOUNCE_MS = 300

export default function TableSearch({ placeholder }: { placeholder: string }) {
  const { setParams, pending, searchParams } = useListNav()
  const urlValue = searchParams.get('q') ?? ''
  const [value, setValue] = useState(urlValue)
  const lastSent = useRef(urlValue)

  // Keep the box in sync when the URL changes some other way (back button, tabs)
  useEffect(() => {
    if (urlValue !== lastSent.current) {
      lastSent.current = urlValue
      setValue(urlValue)
    }
  }, [urlValue])

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed === lastSent.current.trim()) return
    const timer = setTimeout(() => {
      lastSent.current = trimmed
      setParams({ q: trimmed || null })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value, setParams])

  return (
    <div className="relative w-full sm:w-72">
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-3 pr-9 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
      />
      {pending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
          <Spinner className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}
