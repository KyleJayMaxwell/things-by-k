'use client'

// src/components/ThemeToggle.tsx
// Sun/moon button in the nav. The icon is drawn by CSS from the .dark class on <html>
// (see .theme-toggle in globals.css), so it is right on first paint with no hydration flash.

import { useId, useSyncExternalStore } from 'react'
import { THEME_STORAGE_KEY, applyTheme, currentTheme, saveTheme, savedTheme, type Theme } from '@/lib/theme'

// Every theme change announces itself with a 'themechange' event on window
function subscribe(onChange: () => void) {
  // Keep in step with the device setting until the visitor picks a theme themselves
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (e: MediaQueryListEvent) => {
    if (savedTheme()) return
    applyTheme(e.matches ? 'dark' : 'light')
    onChange()
  }
  // The visitor picked a theme in another tab
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY || (e.newValue !== 'light' && e.newValue !== 'dark')) return
    applyTheme(e.newValue)
    onChange()
  }
  media.addEventListener('change', onSystemChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener('themechange', onChange)
  return () => {
    media.removeEventListener('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('themechange', onChange)
  }
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  // Only used for the label; null on the server, which can't know the theme
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null)
  // The nav renders one toggle for desktop and one for phones, so the mask id must be unique
  const maskId = `theme-toggle-mask-${useId().replace(/:/g, '')}`

  const toggle = () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    const swap = () => {
      applyTheme(next)
      window.dispatchEvent(new Event('themechange'))
    }
    // Crossfade the whole page where the browser supports it and motion is welcome
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(swap)
    } else {
      swap()
    }
  }

  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme ? label : 'Toggle theme'}
      title={theme ? label : undefined}
      className={`theme-toggle min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white transition-colors focus-ring-light rounded-md ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <mask id={maskId}>
          <rect x="0" y="0" width="24" height="24" fill="white" />
          {/* Slides in over the sun to bite out the crescent */}
          <circle className="theme-toggle__bite" cx="17" cy="7" r="6.5" fill="black" />
        </mask>
        <circle className="theme-toggle__core" cx="12" cy="12" r="8" fill="currentColor" stroke="none" mask={`url(#${maskId})`} />
        <g className="theme-toggle__rays">
          <path d="M12 1.75v1.5M12 20.75v1.5M1.75 12h1.5M20.75 12h1.5M4.75 4.75l1.06 1.06M18.19 18.19l1.06 1.06M4.75 19.25l1.06-1.06M18.19 5.81l1.06-1.06" />
        </g>
      </svg>
    </button>
  )
}
