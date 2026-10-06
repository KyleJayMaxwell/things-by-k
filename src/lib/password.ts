// src/lib/password.ts

export const MIN_PASSWORD_LENGTH = 8

// Returns what's wrong with a new password, or null if it's fine
export function checkNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  if (password !== confirm) return 'Passwords don’t match.'
  return null
}
