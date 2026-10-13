'use client'

// src/app/account/login/page.tsx

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Button from '@/components/Button'
import PasswordInput from '@/components/PasswordInput'
import TextField from '@/components/TextField'
import GoogleIcon from '@/components/icons/GoogleIcon'
import { passwordError, confirmPasswordError } from '@/lib/password'
import { safeRedirectPath } from '@/lib/redirect'
import { isValidEmail, authErrorMessage } from '@/lib/validation'
import { errorMessage } from '@/lib/errors'

type Tab = 'signin' | 'register'

const LINK_ERRORS: Record<string, string> = {
  link: 'That link has expired or was already used. If you were confirming your email, try signing in. Otherwise request a new link.',
  social: 'Google sign-in didn’t finish. Please try again, or use your email instead.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'), '/account')

  const [tab, setTab] = useState<Tab>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    LINK_ERRORS[searchParams.get('error') ?? ''] ?? null
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)

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

  // Sends the customer to Google, which returns them to /auth/callback signed in.
  // New customers get an account automatically.
  const handleGoogle = async () => {
    setError(null)
    setSuccess(null)
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
    // On success the browser is already leaving the page
    if (error) {
      setError(authErrorMessage(error.message))
      setGoogleLoading(false)
    }
  }

  // Magic link: a one-time sign-in link by email, no password needed.
  // Creates the account if this email is new.
  const handleSendLink = async () => {
    if (signInErrors.email) return
    setError(null)
    setSuccess(null)
    setNeedsConfirmation(false)
    setSendingLink(true)
    try {
      const email = signInEmail.trim()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) setError(authErrorMessage(error.message))
      else setSuccess(`Check your inbox. We sent a sign-in link to ${email}.`)
    } catch (err) {
      setError(authErrorMessage(errorMessage(err, 'We couldn’t send the link. Please try again.')))
    }
    setSendingLink(false)
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

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          loading={googleLoading}
          onClick={handleGoogle}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white">
            <GoogleIcon className="w-4 h-4" />
          </span>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 my-6 text-xs text-text-secondary">
          <span className="flex-1 h-px bg-border" />
          or use your email
          <span className="flex-1 h-px bg-border" />
        </div>

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

            <Button
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              loading={sendingLink}
              disabled={!!signInErrors.email}
              onClick={handleSendLink}
            >
              Email me a sign-in link
            </Button>
            <p className="text-xs text-text-secondary text-center -mt-1">
              No password needed. We’ll email you a link that signs you in.
            </p>

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
