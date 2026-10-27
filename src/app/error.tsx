'use client'

// src/app/error.tsx
// Shown in place of a page that crashed; the nav and footer stay

import { useEffect } from 'react'
import StatusPage, { statusButtonClass } from '@/components/StatusPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title="That didn’t load"
      message={
        <>
          The problem is on the shop’s end, not yours. Try again, and if it keeps happening email{' '}
          <a href="mailto:hello@things-by-k.com" className="text-text-primary underline underline-offset-2 whitespace-nowrap">hello@things-by-k.com</a>.
        </>
      }
      action={<button type="button" onClick={reset} className={statusButtonClass}>Try again</button>}
    />
  )
}
