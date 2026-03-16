// src/components/Footer.tsx

import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <p>© {year} Things by K. All rights reserved.</p>
        <nav className="flex items-center gap-6">
          <Link href="/shop" className="hover:text-primary transition-colors focus-ring rounded">Shop</Link>
          <Link href="/about" className="hover:text-primary transition-colors focus-ring rounded">About</Link>
          <Link href="/account" className="hover:text-primary transition-colors focus-ring rounded">Account</Link>
        </nav>
      </div>
    </footer>
  )
}
