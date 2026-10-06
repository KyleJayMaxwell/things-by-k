'use client'

// src/app/admin/page.tsx

import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Badge, { STATUS_CHART_COLORS } from '@/components/Badge'
import type { OrderStatus } from '@/types'
import { formatPrice, formatDate } from '@/lib/format'

interface OverviewOrder {
  id: string
  order_number: string
  email: string
  total: number
  status: OrderStatus
  created_at: string
  order_items: { product_name: string; quantity: number }[]
}

interface OverviewProduct {
  id: string
  name: string
  stock: number
  is_active: boolean
}

// Sums a value per day, keeping days in order
function totalsByDay(orders: OverviewOrder[], value: (o: OverviewOrder) => number) {
  const map: Record<string, number> = {}
  orders.forEach(o => {
    const day = formatDate(o.created_at, 'day')
    map[day] = (map[day] ?? 0) + value(o)
  })
  return Object.entries(map)
}

export default function AdminPage() {
  const [orders, setOrders] = useState<OverviewOrder[]>([])
  const [products, setProducts] = useState<OverviewProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const since = new Date()
      since.setDate(since.getDate() - 30)

      const [ordersRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, email, total, status, created_at, order_items(product_name, quantity)')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('products').select('id, name, stock, is_active'),
      ])

      setOrders((ordersRes.data as OverviewOrder[] | null) ?? [])
      setProducts(productsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Refunded orders don't count toward revenue or units sold
  const paidOrders = orders.filter(o => o.status !== 'refunded')

  const revenueByDay = totalsByDay(paidOrders, o => o.total)
    .map(([date, cents]) => ({ date, revenue: cents / 100 }))

  const volumeByDay = totalsByDay(orders, () => 1)
    .map(([date, count]) => ({ date, orders: count }))

  const statusData = (Object.keys(STATUS_CHART_COLORS) as OrderStatus[])
    .map(name => ({ name, value: orders.filter(o => o.status === name).length }))
    .filter(entry => entry.value > 0)

  const unitsByProduct: Record<string, number> = {}
  paidOrders.forEach(o => o.order_items.forEach(item => {
    unitsByProduct[item.product_name] = (unitsByProduct[item.product_name] ?? 0) + item.quantity
  }))
  const salesByProduct = Object.entries(unitsByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, units]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, units }))

  // Summary stats
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
  const processingCount = orders.filter(o => o.status === 'processing').length
  const lowStock = products.filter(p => p.is_active && p.stock <= 5)
  const recentOrders = [...orders].reverse().slice(0, 5)

  if (loading) {
    return <div className="text-text-secondary text-sm">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Overview</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary bg-gray-100 px-3 py-1 rounded-full">Last 30 days</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue" value={formatPrice(totalRevenue)} />
        <StatCard label="Orders" value={orders.length.toString()} />
        <StatCard label="Processing" value={processingCount.toString()} highlight={processingCount > 0} />
        <StatCard label="Active Products" value={products.filter(p => p.is_active).length.toString()} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Revenue over time */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Revenue</h2>
          {revenueByDay.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v) => [`$${(Number(v) || 0).toFixed(2)}`, 'Revenue']} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#360F5A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">By Status</h2>
          {statusData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map(entry => (
                    <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [(Number(v) || 0).toFixed(2), name]} contentStyle={tooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: '#6B7280' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Daily order volume */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Daily Orders</h2>
          {volumeByDay.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [(Number(v) || 0).toFixed(2), 'Orders']} contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#360F5A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales by product */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-medium text-text-primary mb-4">Sales by Product</h2>
          {salesByProduct.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesByProduct} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(v) => [(Number(v) || 0).toFixed(2), 'Units sold']} contentStyle={tooltipStyle} />
                <Bar dataKey="units" fill="#E8DFF0" radius={[0, 3, 3, 0]}>
                  {salesByProduct.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#360F5A' : '#E8DFF0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-medium text-text-primary">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:text-primary-hover transition-colors">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-text-secondary text-sm px-5 py-8 text-center">No orders in the last 30 days.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map(order => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{order.email} · {formatDate(order.created_at, 'day')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={order.status} />
                    <span className="text-sm font-medium text-text-primary">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-medium text-text-primary">Low Stock</h2>
            <Link href="/admin/products" className="text-xs text-primary hover:text-primary-hover transition-colors">
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-text-secondary text-sm px-5 py-8 text-center">All products well-stocked.</p>
          ) : (
            <div className="divide-y divide-border">
              {lowStock.map(product => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <p className="text-sm text-text-primary group-hover:text-primary transition-colors truncate pr-4">
                    {product.name}
                  </p>
                  <span className={`text-sm font-semibold flex-shrink-0 ${product.stock === 0 ? 'text-error' : 'text-warning'}`}>
                    {product.stock === 0 ? 'Sold out' : `${product.stock} left`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const tooltipStyle = {
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white border border-border rounded-xl px-5 py-4">
      <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${highlight ? 'text-warning' : 'text-text-primary'}`}>{value}</p>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center text-text-secondary text-sm">
      No data yet
    </div>
  )
}