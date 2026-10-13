// src/app/auth/callback/route.ts
// Landing spot for Supabase email links (confirm sign-up, reset password, magic link)
// and for Google sign-in. Trades the one-time code for a session, then continues on.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/redirect'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'), '/account')

  // Google sends the customer back with ?error=... when they cancel or something fails
  if (searchParams.get('error')) {
    console.error('Social sign-in failed:', searchParams.get('error_description') ?? searchParams.get('error'))
    return NextResponse.redirect(`${origin}/account/login?error=social`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('Auth callback failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/account/login?error=link`)
}
