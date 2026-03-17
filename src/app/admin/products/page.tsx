// src/app/admin/products/page.tsx

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Products' }

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/')

  const serviceClient = createServiceClient()
  const { data: products } = await serviceClient
    .from('products')
    .select('id, name, price, stock, is_active, category, images')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Add Product
        </Link>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {!products || products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-sm mb-4">No products yet.</p>
            <Link href="/admin/products/new" className="text-sm text-primary hover:text-primary-hover font-medium">
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-text-secondary uppercase tracking-wider">
              <span className="col-span-5">Product</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-1 text-right">Stock</span>
              <span className="col-span-2 text-right">Status</span>
            </div>
            {products.map(product => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="grid grid-cols-12 px-5 py-4 hover:bg-gray-50 transition-colors group items-center"
              >
                <div className="col-span-5 flex items-center gap-3">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-border flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                    {product.name}
                  </span>
                </div>
                <span className="col-span-2 text-sm text-text-secondary capitalize">{product.category}</span>
                <span className="col-span-2 text-sm text-text-primary text-right">{formatPrice(product.price)}</span>
                <span className={`col-span-1 text-sm font-medium text-right ${
                  product.stock === 0 ? 'text-error' : product.stock <= 5 ? 'text-warning' : 'text-text-primary'
                }`}>
                  {product.stock}
                </span>
                <span className="col-span-2 flex justify-end">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {product.is_active ? 'Active' : 'Hidden'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
