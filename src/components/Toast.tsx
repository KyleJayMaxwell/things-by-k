'use client'

// src/components/Toast.tsx

import { useEffect } from 'react'
import Link from 'next/link'

interface ToastProps {
  message: string
  linkLabel?: string
  linkHref?: string
  onClose: () => void
  duration?: number
}

export default function Toast({
  message,
  linkLabel,
  linkHref,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div role="status" aria-live="polite" className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-text-primary text-white text-sm px-4 py-3 rounded-lg shadow-lg animate-slide-in">
      {/* Checkmark */}
      <svg className="w-4 h-4 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>

      <span>{message}</span>

      {linkLabel && linkHref && (
        <Link href={linkHref} className="underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap">
          {linkLabel}
        </Link>
      )}

      <button onClick={onClose} className="ml-1 p-1 -mr-1 min-w-[32px] min-h-[32px] flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}
