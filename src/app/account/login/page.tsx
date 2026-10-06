'use client'

// src/app/account/login/page.tsx

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Button from '@/components/Button'
import PasswordInput from '@/components/PasswordInput'
import TextField from '@/components/TextField'
import { passwordError, confirmPasswordError } from '@/lib/password'
import { safeRedirectPath } from '@/lib/redirect'
import { isValidEmail, authErrorMessage } from '@/lib/validation'
import { errorMessage } from '@/lib/errors'

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

  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resending, setResending] = useState(false)

  const supabase = createClient()

  const emailError = (email: string) => (isValidEmail(email) ? null : 'Enter a valid email, like you@example.com.')

  const signInErrors = {
    email: emailError(signInEmail),
    password: signInPassword ? null : 'Enter your password.',
  }
  const registerErrors = {
    firstName: firstName.trim() ? null : 'Enter your first name.',
    email: emailError(registerEmail),
    password: passwordError(registerPassword),
    confirm: registerConfirm ? confirmPasswordError(registerPassword, registerConfirm) : 'Type your password again.',
  }
  const canSignIn = Object.values(signInErrors).every(e => !e)
  const canRegister = Object.values(registerErrors).every(e => !e)

  const switchTab = (next: Tab) => {
    setTab(next)
    setError(null)
    setSuccess(null)
    setNeedsConfirmation(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSignIn) return
    setError(null)
    setNeedsConfirmation(false)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail.trim(),
        password: signInPassword,
      })
      if (error) {
        setError(authErrorMessage(error.message))
        setNeedsConfirmation(error.message.toLowerCase().includes('email not confirmed'))
        setLoading(false)
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      setError(authErrorMessage(errorMessage(err, 'Sign in failed. Please try again.')))
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: signInEmail.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` },
    })
    setResending(false)
    if (error) {
      setError(authErrorMessage(error.message))
    } else {
      setError(null)
      setNeedsConfirmation(false)
      setSuccess(`We sent a new confirmation link to ${signInEmail.trim()}.`)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canRegister) return
    setError(null)
    setLoading(true)

    try {
      const email = registerEmail.trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password: registerPassword,
        options: {
          data: { first_name: firstName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      })

      if (error) {
        setError(authErrorMessage(error.message))
      } else if (data.user && data.user.identities?.length === 0) {
        // Supabase answers this way, without an error, when the email already has an account
        setError(authErrorMessage('already registered'))
      } else {
        setSuccess(`Account created! We sent a confirmation link to ${email}. Click it, then sign in.`)
        setRegisterPassword('')
        setRegisterConfirm('')
      }
    } catch (err) {
      setError(authErrorMessage(errorMessage(err, 'Sign up failed. Please try again.')))
    }
    setLoading(false)
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
            onClick={() => switchTab('signin')}
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
            onClick={() => switchTab('register')}
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
            {needsConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="block mt-2 font-medium underline hover:no-underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Send me a new confirmation link'}
              </button>
            )}
          </div>
        )}
        {success && (
          <div role="status" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-success">
            {success}
          </div>
        )}

        {/* Sign In form */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <TextField
              id="signin-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={signInEmail}
              onChange={setSignInEmail}
              error={signInErrors.email}
              placeholder="you@example.com"
            />
            <PasswordInput
              id="signin-password"
              label="Password"
              value={signInPassword}
              onChange={setSignInPassword}
              autoComplete="current-password"
              placeholder="••••••••"
              error={signInErrors.password}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={!canSignIn}>
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
          <form onSubmit={handleRegister} noValidate className="space-y-4">
            <TextField
              id="register-firstname"
              label="First Name"
              autoComplete="given-name"
              value={firstName}
              onChange={setFirstName}
              error={registerErrors.firstName}
              placeholder="K"
              maxLength={50}
            />
            <TextField
              id="register-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={registerEmail}
              onChange={setRegisterEmail}
              error={registerErrors.email}
              placeholder="you@example.com"
            />
            <PasswordInput
              id="register-password"
              label="Password"
              value={registerPassword}
              onChange={setRegisterPassword}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              error={registerErrors.password}
              hint="At least 8 characters."
            />
            <PasswordInput
              id="register-password-confirm"
              label="Confirm password"
              value={registerConfirm}
              onChange={setRegisterConfirm}
              autoComplete="new-password"
              placeholder="Type it again"
              error={registerErrors.confirm}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={!canRegister}>
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
