'use client'

// src/components/AccountMenu.tsx
// The person icon in the nav. Signed out: a link to sign in.
// Signed in: a small menu with Account, Orders and Sign out.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AccountIcon from './icons/AccountIcon'
import { useSignedIn, useSignOut } from '@/lib/useAuth'

const ICON_CLASSES =
  'min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors focus-ring-light rounded-md'
const ITEM_CLASSES =
  'block w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-primary-light focus:bg-primary-light focus:text-text-primary focus:outline-none'

export default function AccountMenu() {
  const signedIn = useSignedIn()
  const { signOut, signingOut } = useSignOut()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on route change (adjusting state during render, per React docs)
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setOpen(false)
  }

  // Close on a click outside the menu
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  if (!signedIn) {
    // Signed out, or still checking: the account page sends signed-out visitors to sign in
    return (
      <Link href={signedIn === false ? '/account/login' : '/account'} className={ICON_CLASSES}>
        <AccountIcon className="w-5 h-5" />
        <span className="sr-only">{signedIn === false ? 'Sign in' : 'Account'}</span>
      </Link>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onKeyDown={e => {
        if (e.key !== 'Escape' || !open) return
        setOpen(false)
        buttonRef.current?.focus()
      }}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="account-menu"
        className={`${ICON_CLASSES} relative`}
      >
        <AccountIcon className="w-5 h-5" />
        {/* Small dot: signed in */}
        <span aria-hidden="true" className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-white ring-2 ring-brand" />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <ul id="account-menu" className="absolute right-0 top-full mt-2 min-w-44 bg-surface rounded-lg shadow-lg border border-border py-2">
          <li><Link href="/account" className={ITEM_CLASSES}>Account</Link></li>
          <li><Link href="/account/orders" className={ITEM_CLASSES}>Orders</Link></li>
          <li className="mt-1 pt-1 border-t border-border">
            <button type="button" onClick={signOut} disabled={signingOut} className={ITEM_CLASSES}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
