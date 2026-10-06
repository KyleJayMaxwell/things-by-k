'use client'

// src/app/account/forgot-password/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-2">Forgot your password?</h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Enter your email and we’ll send you a link to choose a new one.
        </p>

        {sent ? (
          <div role="status" className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-success">
            If there’s an account for {email}, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Send reset link
            </Button>
          </form>
        )}

        <Link
          href="/account/login"
          className="block mt-6 text-center text-sm text-text-secondary hover:text-primary transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
