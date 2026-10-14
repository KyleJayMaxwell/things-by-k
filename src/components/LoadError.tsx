'use client'

// src/components/LoadError.tsx
// Shown in place of a list or page when its data couldn't be loaded, so a failed load
// never looks like "nothing here"

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import Spinner from './Spinner'

// Server pages retry by refreshing; pages that load in the browser pass their own onRetry
export default function LoadError({ message, onRetry, className = 'py-20' }: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  const router = useRouter()
  const [retrying, startRetry] = useTransition()

  return (
    <div role="alert" className={`flex flex-col items-center justify-center gap-4 text-center ${className}`}>
      <p className="text-text-secondary">{message}</p>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : startRetry(() => router.refresh()))}
        disabled={retrying}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
      >
        {retrying && <Spinner />}
        Try again
      </button>
    </div>
  )
}
