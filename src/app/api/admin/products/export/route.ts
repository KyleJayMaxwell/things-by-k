// src/app/api/admin/products/export/route.ts
// Admin-only: CSV of every product matching the table's current search, filters and sort

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { applyProductFilters, parseProductParams } from '@/lib/adminProducts'
import { csvResponse, toCsv } from '@/lib/csv'
import { productHref } from '@/lib/shopSections'

const MAX_ROWS = 5000

export async function GET(request: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const p = parseProductParams(Object.fromEntries(request.nextUrl.searchParams))
  const { data, error } = await applyProductFilters(
    createServiceClient()
      .from('products')
      .select('name, slug, category, price, handwritten_price, stock, is_active, images, created_at, updated_at'),
    p
  )
    .order(p.sort, { ascending: p.dir === 'asc' })
    .order('id')
    .limit(MAX_ROWS)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const site = request.nextUrl.origin
  const csv = toCsv(
    ['Name', 'Category', 'Price', 'Handwritten extra', 'Stock', 'Status', 'Photos', 'Added', 'Updated', 'Shop link'],
    (data ?? []).map(product => [
      product.name,
      product.category,
      (product.price / 100).toFixed(2),
      product.handwritten_price != null ? (product.handwritten_price / 100).toFixed(2) : '',
      product.stock,
      product.is_active ? 'Active' : 'Hidden',
      product.images.length,
      product.created_at.slice(0, 10),
      product.updated_at.slice(0, 10),
      `${site}${productHref(product)}`,
    ])
  )

  return csvResponse(csv, `products-${new Date().toISOString().slice(0, 10)}.csv`)
}
