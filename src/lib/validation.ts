// src/lib/validation.ts
// Form checks shared by the account and admin forms

// Deliberately loose: something@something.tld, no spaces. Supabase does the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

// Lowercase letters and numbers separated by single dashes, e.g. "foggy-golden-gate"
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Dollar amount with at most two decimals, e.g. "5" or "5.25"
export function isValidDollarAmount(value: string, { allowZero = false } = {}): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return false
  const amount = parseFloat(value)
  return allowZero ? amount >= 0 : amount > 0
}

export function isWholeNumber(value: string): boolean {
  return /^\d+$/.test(value.trim())
}

// Turns Supabase Auth errors into plain sentences a customer can act on
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'That email and password don’t match. Check them and try again.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. The link is in the email we sent when you signed up.'
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'There’s already an account with this email. Try signing in, or reset your password.'
  }
  if (m.includes('rate limit') || m.includes('security purposes') || m.includes('too many')) {
    return 'Too many tries. Please wait a minute and try again.'
  }
  if (m.includes('session missing') || m.includes('session_not_found')) {
    return 'Your reset link has expired. Please request a new one.'
  }
  if (m.includes('should be different')) return 'Choose a password that’s different from your old one.'
  if (m.includes('fetch') || m.includes('network')) return 'We couldn’t reach the server. Check your connection and try again.'
  return message
}
