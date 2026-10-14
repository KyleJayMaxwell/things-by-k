// src/app/shop/page.tsx

import { createClient } from '@/lib/supabase/server'
import ProductListing from '@/components/shop/ProductListing'
import { fetchActiveCategories, fetchProductPage, parseListingParams, type RawSearchParams } from '@/lib/productListing'
import { CATEGORY_LABELS } from '@/lib/shopSections'
import type { ProductCategory } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Shop original designs by K.',
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[]

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseListingParams(await searchParams, ALL_CATEGORIES)
  const supabase = await createClient()

  const [result, categories] = await Promise.all([
    fetchProductPage(supabase, params),
    fetchActiveCategories(supabase),
  ])

  // Only types that have something on sale
  const types = ALL_CATEGORIES.filter(c => categories.includes(c)).map(c => ({ value: c, label: CATEGORY_LABELS[c] }))

  return (
    <ProductListing
      title="Shop All Products"
      basePath="/shop"
      params={params}
      result={result}
      types={types}
      searchPlaceholder="Search all products"
    />
  )
}
