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
      className={`text-sm tracking-wide transition-colors duration-150 hover:text-primary ${
        pathname === href ? 'text-primary font-medium' : 'text-text-secondary'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-sm border-b border-border shadow-sm'
          : 'bg-background'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="font-semibold text-lg tracking-tight text-text-primary hover:text-primary transition-colors">
          Things by K
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-8">
          {navLink('/shop', 'Shop')}
          {navLink('/about', 'About')}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3">
          {/* Cart */}
          <Link href="/cart" className="relative p-2 text-text-secondary hover:text-primary transition-colors focus-ring rounded-md">
            <CartIcon className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Link>

          {/* Account */}
          <Link href="/account" className="p-2 text-text-secondary hover:text-primary transition-colors focus-ring rounded-md">
            <AccountIcon className="w-5 h-5" />
            <span className="sr-only">Account</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-text-secondary hover:text-primary transition-colors focus-ring rounded-md"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="block w-5 space-y-1">
              <span className={`block h-px bg-current transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
              <span className={`block h-px bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-px bg-current transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-4">
          {navLink('/shop', 'Shop')}
          {navLink('/about', 'About')}
        </div>
      )}
    </header>
  )
}
