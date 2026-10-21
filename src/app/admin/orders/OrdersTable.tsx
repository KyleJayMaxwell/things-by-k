'use client'

// src/app/admin/orders/OrdersTable.tsx
// Rows of the admin orders table. Sorting, filtering and paging happen on the server (see page.tsx).

import Link from 'next/link'
import Badge from '@/components/Badge'
import { formatPrice } from '@/lib/format'
import type { OrderStatus } from '@/types'

export interface OrderTableRow {
  id: string
  orderNumber: string
  email: string
  name: string | null
  customerHref: string   // all orders from this customer
  date: string           // formatted in the shop's time zone
  time: string
  lateDays: number | null  // set when an unshipped order is getting old
  status: OrderStatus
  tracking: { carrier: string; number: string } | null
  items: number
  handwritten: boolean
  total: number
}

interface OrdersTableProps {
  rows: OrderTableRow[]
  header: React.ReactNode   // sortable <th> cells, rendered on the server
}

export default function OrdersTable({ rows, header }: OrdersTableProps) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="text-xs text-text-secondary border-b border-border">
          <tr>{header}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(order => (
            <tr key={order.id} className="hover:bg-primary-light transition-colors">
              <td className="pl-5 pr-3 py-3 whitespace-nowrap">
                <Link href={`/admin/orders/${order.id}`} prefetch={false} className="font-medium text-text-primary hover:text-primary hover:underline">
                  {order.orderNumber}
                </Link>
                {order.handwritten && (
                  <span title="Includes a handwritten note" className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded bg-primary-light text-text-primary">
                    ✎ Note
                  </span>
                )}
              </td>
              <td className="px-3 py-3 max-w-[260px]">
                {order.name && <span className="block text-text-primary truncate">{order.name}</span>}
                <Link
                  href={order.customerHref}
                  prefetch={false}
                  title="See all orders from this customer"
                  className="block text-text-secondary hover:text-primary hover:underline truncate"
                >
                  {order.email}
                </Link>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span className="block text-text-primary">{order.date}</span>
                <span className="text-xs text-text-secondary">{order.time}</span>
                {order.lateDays !== null && (
                  <span className="ml-2 text-xs font-medium text-warning">{order.lateDays} days</span>
                )}
              </td>
              <td className="px-3 py-3"><Badge status={order.status} /></td>
              <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                {order.tracking ? (
                  <>
                    <span className="text-xs">{order.tracking.carrier}</span>{' '}
                    <span className="text-text-primary">{order.tracking.number}</span>
                  </>
                ) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-text-secondary">{order.items}</td>
              <td className="pl-3 pr-5 py-3 text-right font-medium text-text-primary">{formatPrice(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
