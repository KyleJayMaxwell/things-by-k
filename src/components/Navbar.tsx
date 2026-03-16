'use client'

// src/components/Navbar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import CartIcon from './icons/CartIcon'
import AccountIcon from './icons/AccountIcon'
import { useCart } from '@/context/CartContext'

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { itemCount } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm tracking-wide transition-colors duration-150 hover:text-primary focus-ring rounded ${
        pathname === href ? 'text-primary font-medium' : 'text-text-secondary'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-sm border-b border-border shadow-sm'
          : 'bg-background'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="font-semibold text-lg tracking-tight text-text-primary hover:text-primary transition-colors focus-ring rounded">
          Things by K
        </Link>

        {/* Desktop nav links */}
        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-8">
          {navLink('/shop', 'Shop')}
          {navLink('/about', 'About')}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-primary transition-colors focus-ring rounded-md"
          >
            <CartIcon className="w-5 h-5" />
            {itemCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center px-1"
                aria-hidden="true"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
            <span className="sr-only">
              Cart{itemCount > 0 ? `, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : ''}
            </span>
          </Link>

          {/* Account */}
          <Link
            href="/account"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-primary transition-colors focus-ring rounded-md"
          >
            <AccountIcon className="w-5 h-5" />
            <span className="sr-only">Account</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-primary transition-colors focus-ring rounded-md"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="block w-5 space-y-1">
              <span className={`block h-px bg-current transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block h-px bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px bg-current transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu — always rendered, animated via max-height */}
      <div
        id="mobile-menu"
        className={`sm:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
          menuOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile navigation" className="border-t border-border bg-white px-4 py-4 flex flex-col gap-4">
          {navLink('/shop', 'Shop')}
          {navLink('/about', 'About')}
        </nav>
      </div>
    </header>
  )
}
