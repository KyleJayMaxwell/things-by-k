// src/app/admin/layout.tsx

import { getAdminUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="theme-light min-h-screen bg-gray-50 text-text-primary md:flex">
      {/* Sidebar on desktop (its links stick below the navbar; the column ends above the footer), top bar on phones */}
      <aside className="bg-white border-b border-border md:border-b-0 md:border-r md:w-56 md:shrink-0">
        <div className="md:sticky md:top-16">
          <div className="px-5 py-4 md:py-5 md:border-b border-border">
            <Link href="/" className="text-xs text-text-secondary hover:text-primary transition-colors">
              ← Things by K
            </Link>
            <p className="text-sm font-semibold text-text-primary mt-1">Admin</p>
          </div>
          <nav className="flex gap-1 px-3 pb-3 md:block md:py-4 md:pb-4 md:space-y-1">
            <AdminNavLink href="/admin" label="Overview" />
            <AdminNavLink href="/admin/orders" label="Orders" />
            <AdminNavLink href="/admin/products" label="Products" />
          </nav>
          <div className="hidden md:block px-5 py-4 border-t border-border">
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
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
