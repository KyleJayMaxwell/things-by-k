'use client'

// src/app/account/forgot-password/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'
import TextField from '@/components/TextField'
import { isValidEmail, authErrorMessage } from '@/lib/validation'
import { errorMessage } from '@/lib/errors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailValid = isValidEmail(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailValid) return
    setError(null)
    setLoading(true)
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
      })
      if (error) setError(authErrorMessage(error.message))
      else setSent(true)
    } catch (err) {
      setError(authErrorMessage(errorMessage(err, 'Something went wrong. Please try again.')))
    }
    setLoading(false)
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
            If there’s an account for {email.trim()}, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
                {error}
              </div>
            )}
            <TextField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              error={emailValid ? null : 'Enter a valid email, like you@example.com.'}
              placeholder="you@example.com"
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={!emailValid}>
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
