// src/app/account/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from './SignOutButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Account' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/account/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.first_name || 'there'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-semibold text-text-primary mb-1">
        Hi, {firstName} 👋
      </h1>
      <p className="text-text-secondary mb-10">{user.email}</p>

      <div className="space-y-3">
        <Link
          href="/account/orders"
          className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="font-medium text-text-primary group-hover:text-primary transition-colors">Order History</p>
            <p className="text-sm text-text-secondary mt-0.5">View your past purchases</p>
          </div>
          <svg className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>

        <Link
          href="/shop"
          className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="font-medium text-text-primary group-hover:text-primary transition-colors">Shop</p>
            <p className="text-sm text-text-secondary mt-0.5">Browse the latest goods</p>
          </div>
          <svg className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  )
}
