// src/components/Badge.tsx
// Order status pill, shared by the shop and admin pages

import { OrderStatus } from '@/types'

interface BadgeProps {
  status: OrderStatus
}

const config: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  processing: {
    label: 'Processing',
    className: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900',
    dot: 'bg-amber-500',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
    dot: 'bg-sky-500',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
    dot: 'bg-emerald-500',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900',
    dot: 'bg-red-500',
  },
}

// Chart colors that match the pills (admin overview donut)
export const STATUS_CHART_COLORS: Record<OrderStatus, string> = {
  processing: '#F59E0B',
  shipped: '#0EA5E9',
  delivered: '#10B981',
  refunded: '#EF4444',
}

export default function Badge({ status }: BadgeProps) {
  const { label, className, dot } = config[status] ?? config.processing
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
