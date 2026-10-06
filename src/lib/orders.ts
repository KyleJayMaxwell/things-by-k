// src/lib/orders.ts

import type { User } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'

// Orders placed as a guest (or before signing up) are saved with just an email.
// Once someone has an account with that confirmed email, attach them to it so
// they show up in Order History.
export async function claimGuestOrders(user: User) {
  if (!user.email || !user.email_confirmed_at) return
  const { error } = await createServiceClient()
    .from('orders')
    .update({ user_id: user.id })
    .is('user_id', null)
    // Case-insensitive exact match: escape LIKE wildcards so "a_b@x.com" can't match "aXb@x.com"
    .ilike('email', user.email.replace(/[\\%_]/g, '\\$&'))
  if (error) console.error('Failed to link guest orders:', error.message)
}
