'use client'

// src/app/global-error.tsx
// Last resort when the whole layout fails, so it brings its own <html> and <body>

import './globals.css'
import StatusPage, { statusButtonClass } from '@/components/StatusPage'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans">
        <StatusPage
          eyebrow="Something went wrong"
          title="That didn’t load"
          message="It’s on our end, not yours. Please try again in a moment."
          action={<button type="button" onClick={reset} className={statusButtonClass}>Try again</button>}
        />
      </body>
    </html>
  )
}
