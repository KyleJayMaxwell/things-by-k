// src/components/AgreeToTerms.tsx
// One-line notice under the buttons that place an order or create an account

import Link from 'next/link'

const LINK = 'underline underline-offset-2 hover:text-botan transition-colors focus-ring rounded'

export default function AgreeToTerms({ action, className = '' }: { action: string; className?: string }) {
  return (
    <p className={`text-xs text-text-secondary text-center ${className}`}>
      By {action}, you agree to the{' '}
      <Link href="/terms" className={LINK}>Terms</Link> and{' '}
      <Link href="/privacy" className={LINK}>Privacy</Link> policy.
    </p>
  )
}
