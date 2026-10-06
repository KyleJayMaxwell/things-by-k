// src/lib/password.ts

export const MIN_PASSWORD_LENGTH = 8

export function passwordError(password: string): string | null {
  return password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null
}

export function confirmPasswordError(password: string, confirm: string): string | null {
  return confirm !== password ? 'Passwords don’t match.' : null
}

