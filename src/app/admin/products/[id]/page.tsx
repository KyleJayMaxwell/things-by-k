// src/app/admin/products/[id]/page.tsx

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '../ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Product' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/')

  const serviceClient = createServiceClient()
  const { data: product } = await serviceClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

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
