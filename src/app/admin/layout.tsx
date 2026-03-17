// src/app/admin/layout.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-border flex flex-col fixed h-full z-20">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/" className="text-xs text-text-secondary hover:text-primary transition-colors">
            ← Things by K
          </Link>
          <p className="text-sm font-semibold text-text-primary mt-1">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <AdminNavLink href="/admin" label="Overview" exact />
          <AdminNavLink href="/admin/orders" label="Orders" />
          <AdminNavLink href="/admin/products" label="Products" />
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-text-secondary truncate">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 p-8">
        {children}
      </main>
    </div>
  )
}

function AdminNavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  // We use a client component for active state
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
    >
      {label}
    </Link>
  )
}
