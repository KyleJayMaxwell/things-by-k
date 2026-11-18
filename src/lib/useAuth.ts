'use client'

// src/lib/useAuth.ts
// Sign-in state and sign-out for Client Components (nav, cart, order-complete page).

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// true / false once known; null while loading, so signed-in-only UI doesn't flash.
// Follows sign-in and sign-out in this tab and in other tabs.
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((_event, session) => setSignedIn(!!session))
    return () => data.subscription.unsubscribe()
  }, [])

  return signedIn
}

// Signs out, then goes home and refreshes server-rendered pages
export function useSignOut() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    setSigningOut(true)
    try {
      await createClient().auth.signOut()
      router.push('/')
      router.refresh()
    } finally {
      // The nav menu stays mounted, so reset for the next sign-in
      setSigningOut(false)
    }
  }

  return { signOut, signingOut }
}
