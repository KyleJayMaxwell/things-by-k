// src/lib/redirect.ts

// Only follow redirects to paths on this site, never to another domain.
// Browsers drop tabs and newlines and read "\" as "/", so "/\t/evil.com" or
// "/\evil.com" would become "//evil.com". Resolving against a dummy origin catches
// every such trick: anything that lands on another host is rejected.
export function safeRedirectPath(path: string | null | undefined, fallback: string): string {
  if (!path || !path.startsWith('/')) return fallback
  try {
    const url = new URL(path, 'http://same.invalid')
    if (url.origin !== 'http://same.invalid') return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}
