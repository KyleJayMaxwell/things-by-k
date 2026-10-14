// next.config.ts
import type { NextConfig } from 'next'

// Standard browser safety headers, sent on every page and API response.
const securityHeaders = [
  // Browsers only ever use HTTPS for the site (2 years)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Stop other sites from embedding the shop in a frame (clickjacking)
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Keep full URLs (like the checkout success link) out of other sites' logs
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    // 90 is used by the full-screen hero photos so they stay crisp
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
}

export default nextConfig
