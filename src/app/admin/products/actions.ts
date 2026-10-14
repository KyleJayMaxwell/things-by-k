'use server'

// src/app/admin/products/actions.ts
// Admin-only: show or hide products from the products table (one row or a bulk selection)

import { revalidatePath } from 'next/cache'
import { createServiceClient, getAdminUser } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function setProductsActive(ids: string[], active: boolean): Promise<{ error?: string }> {
  if (!(await getAdminUser())) return { error: 'Not authorized' }
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || !ids.every(id => typeof id === 'string' && UUID.test(id))) {
    return { error: 'Invalid selection' }
  }

  const { error } = await createServiceClient()
    .from('products')
    .update({ is_active: active === true })
    .in('id', ids)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop', 'layout')
  return {}
}
