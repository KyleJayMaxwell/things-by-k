'use client'

// src/components/Navbar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import CartIcon from './icons/CartIcon'
import AccountIcon from './icons/AccountIcon'
import { useCart } from '@/context/CartContext'
import { SHOP_SECTIONS } from '@/lib/shopSections'

// Links in the Shop menu; new sections show up here automatically
const SHOP_LINKS = [
  { href: '/shop', label: 'Shop All' },
  ...SHOP_SECTIONS.map(s => ({ href: `/shop/${s.slug}`, label: s.label })),
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { itemCount } = useCart()

  // Badge pop: replay animation each time itemCount increases
  const prevCountRef = useRef(itemCount)
  const [badgeKey, setBadgeKey] = useState(0)

  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setBadgeKey(k => k + 1)
    }
    prevCountRef.current = itemCount
  }, [itemCount])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change (adjusting state during render, per React docs)
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  // The Shop menu stays open while a link inside it has focus, so let go of focus after navigating
  useEffect(() => {
    const el = document.activeElement
    if (el instanceof HTMLElement && el.closest('[data-shop-menu]')) el.blur()
  }, [pathname])

  // Active on the page itself and anything under it (e.g. /shop/some-product)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const navLink = (href: string, label: string, { exact = false } = {}) => {
    const active = exact ? pathname === href : isActive(href)
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`text-sm font-medium uppercase tracking-wider py-1 border-b-2 transition-colors duration-150 focus-ring-light ${
          active
            ? 'text-white border-white'
            : 'text-white/70 border-transparent hover:text-white hover:border-white/40'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-brand border-b-2 border-botan transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <div className="px-4 sm:px-8 lg:px-10 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">

        {/* Left: links on desktop, menu button on mobile */}
        <div className="flex items-center">
          {/* Desktop nav links */}
          <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-8">
            {/* Shop opens a menu on hover or keyboard focus; clicking Shop still goes to Shop All */}
            <div data-shop-menu className="relative group">
              {navLink('/shop', 'Shop')}
              <div className="absolute left-0 top-full pt-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150">
                <ul className="min-w-44 bg-white rounded-lg shadow-lg border border-border py-2">
                  {SHOP_LINKS.map(link => {
                    const current = pathname === link.href || (link.href !== '/shop' && pathname.startsWith(`${link.href}/`))
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={current ? 'page' : undefined}
                          className={`block px-4 py-2 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none ${
                            current ? 'font-medium text-text-primary' : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
            {navLink('/about', 'About')}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors focus-ring-light rounded-md"
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

        {/* Logo, centered */}
        <Link href="/" className="font-brand text-3xl leading-none -translate-y-[0.1em] text-white hover:text-white/85 transition-colors focus-ring-light rounded">
          Things by K
        </Link>

        {/* Right icons */}
        <div className="flex items-center justify-end gap-1">
          {/* Cart */}
          <Link
            href="/cart"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors focus-ring-light rounded-md"
          >
            <CartIcon className="w-5 h-5" />
            {itemCount > 0 && (
              <span
                key={badgeKey}
                className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-white text-brand text-xs font-semibold rounded-full flex items-center justify-center px-1 animate-badge-pop"
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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors focus-ring-light rounded-md"
          >
            <AccountIcon className="w-5 h-5" />
            <span className="sr-only">Account</span>
          </Link>
        </div>
      </div>

      {/* Mobile menu — always rendered, animated via max-height */}
      <div
        id="mobile-menu"
        className={`sm:hidden overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
          menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav aria-label="Mobile navigation" className="border-t border-white/15 bg-brand px-4 py-4 flex flex-col gap-4">
          {SHOP_LINKS.map(link => (
            <div key={link.href}>{navLink(link.href, link.href === '/shop' ? 'Shop All' : link.label, { exact: link.href === '/shop' })}</div>
          ))}
          {navLink('/about', 'About')}
        </nav>
      </div>
    </header>
  )
}
