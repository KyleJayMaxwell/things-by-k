'use client'

// src/components/admin/DayFilter.tsx
// Pick one day (?day=YYYY-MM-DD); the server shows everything from that whole day

import { useListNav } from './useListNav'

export default function DayFilter({ today }: { today: string }) {
  const { setParams, searchParams } = useListNav()
  const day = searchParams.get('day') ?? ''

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={day}
        max={today}
        onChange={e => setParams({ day: e.target.value || null })}
        aria-label="Order date"
        className="py-1.5 px-3 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
      {day !== today && (
        <button
          type="button"
          onClick={() => setParams({ day: today })}
          className="text-sm text-text-secondary hover:text-primary transition-colors"
        >
          Today
        </button>
      )}
      {day && (
        <button
          type="button"
          onClick={() => setParams({ day: null })}
          className="text-sm text-text-secondary hover:text-primary transition-colors"
        >
          Any date
        </button>
      )}
    </div>
  )
}
