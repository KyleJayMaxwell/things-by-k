// src/app/admin/products/new/page.tsx

import { getAdminUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '../ProductForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Product' }

export default async function NewProductPage() {
  if (!(await getAdminUser())) redirect('/')

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="text-sm text-text-secondary hover:text-primary transition-colors">
          ← Products
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Add Product</h1>
      <ProductForm />
    </div>
  )
}
