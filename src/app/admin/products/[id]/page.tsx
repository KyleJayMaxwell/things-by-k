// src/app/admin/products/[id]/page.tsx

import { createServiceClient, getAdminUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LoadError from '@/components/LoadError'
import ProductForm from '../ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Product' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  if (!(await getAdminUser())) redirect('/')

  const serviceClient = createServiceClient()
  const { data: product, error } = await serviceClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  // PGRST116 means no such row; any other error is a failed load, not a missing product
  if (error && error.code !== 'PGRST116') return <LoadError message="Couldn’t load this product. Please try again." />
  if (!product) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="text-sm text-text-secondary hover:text-primary transition-colors">
          ← Products
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Edit Product</h1>
      <ProductForm initialData={product} />
    </div>
  )
}
