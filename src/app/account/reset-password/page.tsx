'use client'

// src/app/account/reset-password/page.tsx
// Reached from the password reset email (via /auth/callback, which signs the user in)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'
import PasswordInput from '@/components/PasswordInput'
import { passwordError, confirmPasswordError } from '@/lib/password'
import { authErrorMessage } from '@/lib/validation'
import { errorMessage } from '@/lib/errors'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errors = {
    password: passwordError(password),
    confirm: confirm ? confirmPasswordError(password, confirm) : 'Type your new password again.',
  }
  const canSave = !errors.password && !errors.confirm
  const linkExpired = error === authErrorMessage('session missing')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(authErrorMessage(error.message))
        setLoading(false)
        return
      }
      router.push('/account')
      router.refresh()
    } catch (err) {
      setError(authErrorMessage(errorMessage(err, 'Saving failed. Please try again.')))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-8">Choose a new password</h1>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
            {error}
            {linkExpired && (
              <Link href="/account/forgot-password" className="block mt-2 font-medium underline hover:no-underline">
                Send me a new reset link
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <PasswordInput
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password}
            hint="At least 8 characters."
          />
          <PasswordInput
            id="new-password-confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Type it again"
            error={errors.confirm}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={!canSave}>
            Save password
          </Button>
        </form>
      </div>
    </div>
  )
}
