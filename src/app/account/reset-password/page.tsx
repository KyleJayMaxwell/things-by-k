'use client'

// src/app/account/reset-password/page.tsx
// Reached from the password reset email (via /auth/callback, which signs the user in)

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'
import PasswordInput from '@/components/PasswordInput'
import { checkNewPassword } from '@/lib/password'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const passwordProblem = checkNewPassword(password, confirm)
    if (passwordProblem) {
      setError(passwordProblem)
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-8">Choose a new password</h1>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="new-password"
            label="New password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
          />
          <PasswordInput
            id="new-password-confirm"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            placeholder="Type it again"
            minLength={8}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Save password
          </Button>
        </form>
      </div>
    </div>
  )
}
