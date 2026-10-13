// src/app/admin/products/new/page.tsx
// ?copy=<product id> pre-fills the form from an existing product (Duplicate in the products table)

import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '../ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Product' }

interface Props {
  searchParams: Promise<{ copy?: string }>
}

export default async function NewProductPage({ searchParams }: Props) {
  if (!(await getAdminUser())) redirect('/')

  const { copy } = await searchParams
  const { data: source } = copy
    ? await createServiceClient()
        .from('products')
        .select('name, slug, description, long_description, price, category, stock, is_active, images, handwritten_price')
        .eq('id', copy)
        .maybeSingle()
    : { data: null }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="text-sm text-text-secondary hover:text-primary transition-colors">
          ← Products
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Add Product</h1>
      {source ? (
        <p className="text-sm text-text-secondary mb-8">
          Copied from <span className="text-text-primary">{source.name}</span>. Add photos and update the name before saving. It starts hidden from the shop.
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <ProductForm key={copy ?? 'new'} copyFrom={source ?? undefined} />
    </div>
  )
}
