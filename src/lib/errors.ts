// src/lib/errors.ts

// Supabase errors are plain objects with a message, not always Error instances
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return fallback
}
