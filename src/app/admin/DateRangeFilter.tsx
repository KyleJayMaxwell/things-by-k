'use client'

// src/app/admin/DateRangeFilter.tsx
// Preset ranges plus a custom from/to (whole days, local time)

export const RANGE_PRESETS = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: '2weeks', label: '14 days' },
  { key: 'month', label: '30 days' },
  { key: '6months', label: '6 months' },
  { key: 'year', label: 'Year' },
  { key: 'custom', label: 'Custom' },
] as const

export type RangeKey = typeof RANGE_PRESETS[number]['key']

export interface DateRange {
  key: RangeKey
  from: string  // YYYY-MM-DD, used when key is 'custom'
  to: string
}

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

// Parses YYYY-MM-DD as a local date (new Date('2026-10-06') would be UTC)
function parseDay(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toDayString(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Start (inclusive) and end (exclusive) of the range; end is null for "up to now"
export function rangeBounds(range: DateRange): { start: Date; end: Date | null } {
  const today = startOfDay(new Date())
  const start = new Date(today)
  switch (range.key) {
    case 'day': break
    case 'week': start.setDate(start.getDate() - 6); break
    case '2weeks': start.setDate(start.getDate() - 13); break
    case 'month': start.setDate(start.getDate() - 29); break
    case '6months': start.setMonth(start.getMonth() - 6); break
    case 'year': start.setFullYear(start.getFullYear() - 1); break
    case 'custom': {
      const end = parseDay(range.to)
      end.setDate(end.getDate() + 1)  // include the whole "to" day
      return { start: parseDay(range.from), end }
    }
  }
  return { start, end: null }
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
}

export default function DateRangeFilter({ value, onChange }: Props) {
  const today = toDayString(new Date())
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-1">
        {RANGE_PRESETS.map(preset => (
          <button
            key={preset.key}
            onClick={() => onChange({ ...value, key: preset.key })}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              value.key === preset.key
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:text-text-primary'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {value.key === 'custom' && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="date"
            aria-label="From"
            value={value.from}
            max={value.to}
            onChange={e => e.target.value && e.target.value <= value.to && onChange({ ...value, from: e.target.value })}
            className="px-2 py-1 border border-border rounded-lg bg-white"
          />
          <span>to</span>
          <input
            type="date"
            aria-label="To"
            value={value.to}
            min={value.from}
            max={today}
            onChange={e => e.target.value && e.target.value >= value.from && e.target.value <= today && onChange({ ...value, to: e.target.value })}
            className="px-2 py-1 border border-border rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  )
}
