// src/app/admin/orders/page.tsx
// Orders table: search, status and day filters, sorting and paging all run on the server from URL params

import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { listHref, type SearchParams } from '@/lib/listParams'
import { ADMIN_PAGE_SIZES } from '@/lib/adminProducts'
import {
  ORDER_STATUSES, SHIP_WARNING_DAYS, SHOP_TIME_ZONE, applyOrderFilters, daysSince, parseOrderParams, shopToday,
} from '@/lib/adminOrders'
import { CARRIER_NAMES, type Carrier } from '@/lib/tracking'
import type { OrderStatus, ShippingAddress } from '@/types'
import SortableHeader from '@/components/admin/SortableHeader'
import TableSearch from '@/components/admin/TableSearch'
import DayFilter from '@/components/admin/DayFilter'
import Pagination from '@/components/admin/Pagination'
import StatusTabs from '@/components/admin/StatusTabs'
import OrdersTable, { type OrderTableRow } from './OrdersTable'

export const metadata: Metadata = { title: 'Orders' }

const PATHNAME = '/admin/orders'

interface OrderRow {
  id: string
  order_number: string
  email: string
  total: number
  status: OrderStatus
  created_at: string
  carrier: Carrier | null
  tracking_number: string | null
  shipping_address: ShippingAddress | null
  order_items: { quantity: number; handwritten_message: string | null }[]
}

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: SHOP_TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: SHOP_TIME_ZONE, hour: 'numeric', minute: '2-digit' })

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!(await getAdminUser())) redirect('/')

  const params = await searchParams
  const p = parseOrderParams(params)
  const service = createServiceClient()

  // Tab counts ignore the status filter but keep search and day
  const countStatus = (status?: OrderStatus) => {
    const query = applyOrderFilters(service.from('orders').select('id', { count: 'exact', head: true }), p, { status: true })
    return status ? query.eq('status', status) : query
  }

  const [page, all, ...statusCounts] = await Promise.all([
    applyOrderFilters(
      service
        .from('orders')
        .select(
          'id, order_number, email, total, status, created_at, carrier, tracking_number, shipping_address, order_items(quantity, handwritten_message)',
          { count: 'exact' }
        ),
      p
    )
      .order(p.sort, { ascending: p.dir === 'asc' })
      .order('id')  // stable order between pages when sort values tie
      .range(p.from, p.to),
    countStatus(),
    ...ORDER_STATUSES.map(status => countStatus(status)),
  ])

  const rows = (page.data ?? []) as OrderRow[]
  const tableRows: OrderTableRow[] = rows.map(order => {
    const created = new Date(order.created_at)
    const ageDays = daysSince(order.created_at)
    return {
      id: order.id,
      orderNumber: order.order_number,
      email: order.email,
      name: order.shipping_address?.name || null,
      customerHref: listHref(PATHNAME, {}, { q: order.email }),
      date: dateFormat.format(created),
      time: timeFormat.format(created),
      lateDays: order.status === 'processing' && ageDays >= SHIP_WARNING_DAYS ? ageDays : null,
      status: order.status,
      tracking: order.tracking_number
        ? { carrier: order.carrier ? CARRIER_NAMES[order.carrier] : '', number: order.tracking_number }
        : null,
      items: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
      handwritten: order.order_items.some(item => item.handwritten_message),
      total: order.total,
    }
  })
  const total = page.count ?? 0
  const counts = Object.fromEntries(ORDER_STATUSES.map((status, i) => [status, statusCounts[i].count]))
  const filtered = Boolean(p.q || p.status || p.day)
  const query = new URLSearchParams(params as Record<string, string>).toString()
  const exportHref = `/api/admin/orders/export${query ? `?${query}` : ''}`
  const header = { sort: p.sort, dir: p.dir, pathname: PATHNAME, params }

  // "To ship" lists the oldest unshipped orders first, so it works as a packing queue
  const toShip = p.status === 'processing'
  const tab = (label: string, status: OrderStatus | null, count: number | null, changes: Record<string, string | null> = {}) => ({
    label, count, active: (p.status ?? null) === status, changes: { status, ...changes },
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
        <a href={exportHref} className="text-sm text-text-secondary hover:text-primary transition-colors">
          Export CSV
        </a>
      </div>

      <StatusTabs
        pathname={PATHNAME}
        params={params}
        tabs={[
          tab('All', null, all.count, { sort: null, dir: null }),
          tab('To ship', 'processing', counts.processing, { sort: 'created_at', dir: 'asc' }),
          tab('Shipped', 'shipped', counts.shipped, { sort: null, dir: null }),
          tab('Delivered', 'delivered', counts.delivered, { sort: null, dir: null }),
          tab('Refunded', 'refunded', counts.refunded, { sort: null, dir: null }),
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <TableSearch placeholder="Order #, email, name or tracking" />
        <DayFilter today={shopToday()} />
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {page.error ? (
          <p role="alert" className="text-sm text-error px-6 py-12 text-center">Couldn’t load orders: {page.error.message}</p>
        ) : total === 0 && !filtered ? (
          <p className="text-text-secondary text-sm px-6 py-12 text-center">No orders yet.</p>
        ) : (
          <>
            {rows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm mb-2">
                  {toShip && !p.q && !p.day ? 'Nothing to ship. You’re all caught up.' : 'No orders match these filters.'}
                </p>
                {!toShip && (
                  <Link href={PATHNAME} className="text-sm text-primary hover:text-primary-hover font-medium">Clear filters</Link>
                )}
              </div>
            ) : (
              <OrdersTable
                rows={tableRows}
                header={
                  <>
                    <SortableHeader {...header} label="Order" column="order_number" firstDir="desc" className="pl-5" />
                    <SortableHeader {...header} label="Customer" column="email" />
                    <SortableHeader {...header} label="Date" column="created_at" firstDir="desc" />
                    <SortableHeader {...header} label="Status" column="status" />
                    <th scope="col" className="px-3 py-3 font-normal text-left uppercase tracking-wider">Tracking</th>
                    <th scope="col" className="px-3 py-3 font-normal text-right uppercase tracking-wider">Items</th>
                    <SortableHeader {...header} label="Total" column="total" firstDir="desc" align="right" className="pr-5" />
                  </>
                }
              />
            )}
            <Pagination
              page={p.page}
              perPage={p.perPage}
              total={total}
              pageSizes={ADMIN_PAGE_SIZES}
              pathname={PATHNAME}
              params={params}
            />
          </>
        )}
      </div>
    </div>
  )
}
