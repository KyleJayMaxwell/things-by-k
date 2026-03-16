// src/components/Badge.tsx

import { OrderStatus } from '@/types'

interface BadgeProps {
  status: OrderStatus
}

const config: Record<OrderStatus, { label: string; className: string }> = {
  processing: {
    label: 'Processing',
    className: 'bg-primary-light text-primary',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-blue-50 text-blue-700',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-50 text-emerald-700',
  },
}

export default function Badge({ status }: BadgeProps) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
