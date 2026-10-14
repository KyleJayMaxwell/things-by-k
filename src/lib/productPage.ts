// src/lib/productPage.ts
// Loads one product for its page; cached so metadata and the page share a query

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

export const getActiveProduct = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return (data as Product | null) ?? null
})
