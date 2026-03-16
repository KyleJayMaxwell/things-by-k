// src/components/EmptyState.tsx

import Button from './Button'
import Link from 'next/link'

interface EmptyStateProps {
  message: string
  ctaLabel: string
  ctaHref: string
}

export default function EmptyState({ message, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
        <svg className="w-8 h-8 text-primary opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      </div>
      <p className="text-text-secondary">{message}</p>
      <Button as={Link} href={ctaHref} variant="primary" size="md">
        {ctaLabel}
      </Button>
    </div>
  )
}
