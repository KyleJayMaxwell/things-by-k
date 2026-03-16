// src/app/shop/page.tsx

import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse handmade goods and original photography by Kial.',
}

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch products:', error)
  }

  const items: Product[] = products ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-text-primary">Shop</h1>
        <p className="mt-2 text-text-secondary">
          Handmade goods & original photography.
        </p>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">
          <p>No products available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
