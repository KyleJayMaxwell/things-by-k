// src/app/auth/callback/route.ts
// Landing spot for Supabase email links (confirm sign-up, reset password).
// Trades the one-time code in the link for a session, then continues on.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'), '/account')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('Auth callback failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/account/login?error=link`)
}
