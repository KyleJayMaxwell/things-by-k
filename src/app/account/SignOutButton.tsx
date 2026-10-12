'use client'

// src/app/account/SignOutButton.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/Button'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="secondary" size="md" onClick={handleSignOut} loading={signingOut}>
      Sign Out
    </Button>
  )
}
