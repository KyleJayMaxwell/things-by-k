// src/lib/redirect.ts

// Only follow redirects to paths on this site, never to another domain
export function safeRedirectPath(path: string | null | undefined, fallback: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}
