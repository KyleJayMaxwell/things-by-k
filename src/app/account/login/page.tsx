'use client'

// src/app/account/login/page.tsx

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Button from '@/components/Button'
import PasswordInput from '@/components/PasswordInput'
import { checkNewPassword } from '@/lib/password'
import { safeRedirectPath } from '@/lib/redirect'

type Tab = 'signin' | 'register'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'), '/account')

  const [tab, setTab] = useState<Tab>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'link' ? 'That link has expired or was already used. If you were confirming your email, try signing in. Otherwise request a new link.' : null
  )
  const [success, setSuccess] = useState<string | null>(null)

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Register form state
  const [firstName, setFirstName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(redirectTo)
      router.refresh()
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const passwordProblem = checkNewPassword(registerPassword, registerConfirm)
    if (passwordProblem) {
      setError(passwordProblem)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        data: { first_name: firstName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-text-primary text-center mb-8">
          {tab === 'signin' ? 'Welcome back' : 'Create an account'}
        </h1>

        {/* Tab toggle */}
        <div role="tablist" className="flex border border-border rounded-lg overflow-hidden mb-8">
          <button
            role="tab"
            aria-selected={tab === 'signin'}
            onClick={() => { setTab('signin'); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'signin'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'register'}
            onClick={() => { setTab('register'); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / success messages */}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-success">
            {success}
          </div>
        )}

        {/* Sign In form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                value={signInEmail}
                onChange={e => setSignInEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <PasswordInput
              id="signin-password"
              label="Password"
              value={signInPassword}
              onChange={setSignInPassword}
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Sign In
            </Button>

            <Link
              href="/account/forgot-password"
              className="block w-full text-center text-sm text-text-secondary hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-firstname" className="block text-sm font-medium text-text-primary mb-1.5">
                First Name
              </label>
              <input
                id="register-firstname"
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="K"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={registerEmail}
                onChange={e => setRegisterEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <PasswordInput
              id="register-password"
              label="Password"
              value={registerPassword}
              onChange={setRegisterPassword}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              minLength={8}
            />
            <PasswordInput
              id="register-password-confirm"
              label="Confirm password"
              value={registerConfirm}
              onChange={setRegisterConfirm}
              autoComplete="new-password"
              placeholder="Type it again"
              minLength={8}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
