// src/lib/productPage.ts
// Loads one product for its page; cached so metadata and the page share a query

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

export const getActiveProduct = cache(async (slug: string): Promise<Product | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  // Only a missing product is a 404; anything else is a real failure
  if (error) throw new Error(`Failed to load product ${slug}: ${error.message}`)
  return (data as Product | null) ?? null
})
