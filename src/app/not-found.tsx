// src/app/not-found.tsx
// Site-wide 404

import StatusPage from '@/components/StatusPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="This page wandered off"
      message="The link may be old or mistyped. Everything in the shop is still right where it should be."
    />
  )
}
