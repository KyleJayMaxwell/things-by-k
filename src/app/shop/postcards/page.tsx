// src/app/shop/postcards/page.tsx

import { createClient } from '@/lib/supabase/server'
import ProductListing from '@/components/shop/ProductListing'
import { fetchLocations, fetchProductPage, parseListingParams, type RawSearchParams } from '@/lib/productListing'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Postcards',
  description: 'Postcards printed from original photographs.',
}

export default async function PostcardsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parseListingParams(await searchParams)
  const supabase = await createClient()

  const [result, locations] = await Promise.all([
    fetchProductPage(supabase, params, { category: 'postcard' }),
    fetchLocations(supabase, 'postcard'),
  ])

  return (
    <ProductListing
      title="Postcards"
      basePath="/shop/postcards"
      params={params}
      result={result}
      breadcrumbs={[{ label: 'Shop', href: '/shop' }, { label: 'Postcards' }]}
      locations={locations}
      showOrientation
      searchPlaceholder="Search postcards, e.g. Bay Bridge"
    />
  )
}
