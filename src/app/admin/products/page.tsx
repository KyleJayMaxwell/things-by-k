// src/app/admin/products/page.tsx
// Products table: sorting, search, filters and paging all run on the server from URL params

import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { SearchParams } from '@/lib/listParams'
import {
  ADMIN_PAGE_SIZES, PRODUCT_CATEGORIES, applyProductFilters, parseProductParams,
} from '@/lib/adminProducts'
import SortableHeader from '@/components/admin/SortableHeader'
import TableSearch from '@/components/admin/TableSearch'
import FilterSelect from '@/components/admin/FilterSelect'
import Pagination from '@/components/admin/Pagination'
import StatusTabs from '@/components/admin/StatusTabs'
import ProductsTable, { type ProductRow } from './ProductsTable'

export const metadata: Metadata = { title: 'Products' }

const PATHNAME = '/admin/products'

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (!(await getAdminUser())) redirect('/')

  const params = await searchParams
  const p = parseProductParams(params)
  const service = createServiceClient()

  // Tab counts ignore the status and stock filters but keep search and category
  const countWhere = (column?: 'is_active' | 'stock', value?: boolean | number) => {
    const query = applyProductFilters(
      service.from('products').select('id', { count: 'exact', head: true }), p, { status: true, stock: true }
    )
    return column ? query.eq(column, value) : query
  }

  const [page, all, active, hidden, soldOut] = await Promise.all([
    applyProductFilters(
      service
        .from('products')
        .select('id, name, price, stock, is_active, category, images, created_at', { count: 'exact' }),
      p
    )
      .order(p.sort, { ascending: p.dir === 'asc' })
      .order('id')  // stable order between pages when sort values tie
      .range(p.from, p.to),
    countWhere(),
    countWhere('is_active', true),
    countWhere('is_active', false),
    countWhere('stock', 0),
  ])

  const rows = (page.data ?? []) as ProductRow[]
  const total = page.count ?? 0
  const filtered = Boolean(p.q || p.category || p.status || p.stock)
  const exportHref = `/api/admin/products/export${
    Object.keys(params).length ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''
  }`

  const header = {
    sort: p.sort, dir: p.dir, pathname: PATHNAME, params,
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Products</h1>
        <div className="flex items-center gap-3">
          <a href={exportHref} className="text-sm text-text-secondary hover:text-primary transition-colors">
            Export CSV
          </a>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <StatusTabs
        pathname={PATHNAME}
        params={params}
        tabs={[
          { label: 'All', count: all.count, changes: { status: null, stock: null }, active: !p.status && !p.stock },
          { label: 'Active', count: active.count, changes: { status: 'active', stock: null }, active: p.status === 'active' && !p.stock },
          { label: 'Hidden', count: hidden.count, changes: { status: 'hidden', stock: null }, active: p.status === 'hidden' && !p.stock },
          { label: 'Sold out', count: soldOut.count, changes: { status: null, stock: 'out' }, active: !p.status && p.stock === 'out' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <TableSearch placeholder="Search product name" />
        <div className="flex gap-3">
          <FilterSelect
            param="category"
            label="All categories"
            options={PRODUCT_CATEGORIES.map(c => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }))}
          />
          <FilterSelect
            param="stock"
            label="Any stock"
            options={[
              { value: 'in', label: 'In stock' },
              { value: 'low', label: 'Low stock' },
              { value: 'out', label: 'Sold out' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {page.error ? (
          <p role="alert" className="text-sm text-error px-6 py-12 text-center">Couldn’t load products: {page.error.message}</p>
        ) : total === 0 && !filtered ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-sm mb-4">No products yet.</p>
            <Link href="/admin/products/new" className="text-sm text-primary hover:text-primary-hover font-medium">
              Add your first product →
            </Link>
          </div>
        ) : (
          <>
            {rows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm mb-2">No products match these filters.</p>
                <Link href={PATHNAME} className="text-sm text-primary hover:text-primary-hover font-medium">Clear filters</Link>
              </div>
            ) : (
              <ProductsTable
                key={`${p.page}-${p.perPage}-${p.sort}-${p.dir}`}
                rows={rows}
                header={
                  <>
                    <SortableHeader {...header} label="Product" column="name" />
                    <SortableHeader {...header} label="Category" column="category" />
                    <SortableHeader {...header} label="Price" column="price" firstDir="desc" align="right" />
                    <SortableHeader {...header} label="Stock" column="stock" align="right" />
                    <SortableHeader {...header} label="Status" column="is_active" firstDir="desc" align="right" />
                    <SortableHeader {...header} label="Added" column="created_at" firstDir="desc" align="right" />
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
