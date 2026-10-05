// src/components/Footer.tsx

import Link from 'next/link'
import { CONTACT_EMAIL } from '@/lib/site'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <p>© {year} Things by K. All rights reserved.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-primary transition-colors focus-ring rounded">
            {CONTACT_EMAIL}
          </a>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link href="/shop" className="hover:text-primary transition-colors focus-ring rounded">Shop</Link>
          <Link href="/about" className="hover:text-primary transition-colors focus-ring rounded">About</Link>
          <Link href="/shipping" className="hover:text-primary transition-colors focus-ring rounded">Shipping &amp; Returns</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors focus-ring rounded">Privacy</Link>
          <Link href="/account" className="hover:text-primary transition-colors focus-ring rounded">Account</Link>
        </nav>
      </div>
    </footer>
  )
}
