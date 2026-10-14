'use client'

// src/app/admin/products/ProductsTable.tsx
// Rows of the admin products table: selection, bulk show/hide, and a per-row Active toggle.
// Sorting, filtering and paging happen on the server (see page.tsx).

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Spinner from '@/components/Spinner'
import { formatDate, formatPrice } from '@/lib/format'
import { LOW_STOCK } from '@/lib/adminProducts'
import { setProductsActive } from './actions'

export interface ProductRow {
  id: string
  name: string
  category: string
  price: number
  stock: number
  is_active: boolean
  images: string[]
  created_at: string
}

interface ProductsTableProps {
  rows: ProductRow[]
  header: React.ReactNode   // sortable <th> cells, rendered on the server
}

export default function ProductsTable({ rows, header }: ProductsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Drop selections that are no longer on this page (after paging or filtering)
  const visibleSelected = rows.filter(row => selected.has(row.id)).map(row => row.id)
  const allSelected = rows.length > 0 && visibleSelected.length === rows.length

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map(row => row.id)))

  const update = (ids: string[], active: boolean) => {
    setError(null)
    setBusyIds(new Set(ids))
    startTransition(async () => {
      const result = await setProductsActive(ids, active)
      if (result.error) setError(result.error)
      else setSelected(new Set())
      setBusyIds(new Set())
    })
  }

  return (
    <>
      {visibleSelected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-neutral-900 text-white text-sm">
          <span>{visibleSelected.length} selected</span>
          <button type="button" onClick={() => update(visibleSelected, true)} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20">
            Show in shop
          </button>
          <button type="button" onClick={() => update(visibleSelected, false)} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20">
            Hide from shop
          </button>
          {busyIds.size > 0 && <Spinner className="w-4 h-4" />}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-white/70 hover:text-white">
            Clear
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-sm text-error">{error}</div>
      )}

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-xs text-text-secondary border-b border-border">
            <tr>
              <th scope="col" className="pl-5 pr-2 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all products on this page"
                  className="rounded border-border"
                />
              </th>
              {header}
              <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(product => {
              const busy = busyIds.has(product.id)
              return (
                <tr key={product.id} className={`group hover:bg-gray-50 transition-colors ${selected.has(product.id) ? 'bg-gray-50' : ''}`}>
                  <td className="pl-5 pr-2 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleRow(product.id)}
                      aria-label={`Select ${product.name}`}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3 min-w-0">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-border flex-shrink-0" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-medium text-text-primary group-hover:text-primary truncate">{product.name}</span>
                        {product.images.length === 0 && (
                          <span className="text-xs text-warning">No photo</span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-text-secondary capitalize">{product.category}</td>
                  <td className="px-3 py-3 text-right text-text-primary">{formatPrice(product.price)}</td>
                  <td className={`px-3 py-3 text-right font-medium ${
                    product.stock === 0 ? 'text-error' : product.stock <= LOW_STOCK ? 'text-warning' : 'text-text-primary'
                  }`}>
                    {product.stock === 0 ? 'Sold out' : product.stock}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => update([product.id], !product.is_active)}
                      disabled={busy}
                      title={product.is_active ? 'Click to hide from the shop' : 'Click to show in the shop'}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full transition-colors disabled:opacity-60 ${
                        product.is_active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {busy && <Spinner className="w-3 h-3" />}
                      {product.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right text-text-secondary whitespace-nowrap">{formatDate(product.created_at, 'short')}</td>
                  <td className="px-3 py-3 pr-5 text-right">
                    <Link
                      href={`/admin/products/new?copy=${product.id}`}
                      className="text-xs text-text-secondary hover:text-primary whitespace-nowrap"
                    >
                      Duplicate
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
