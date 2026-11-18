'use client'

// src/app/account/SignOutButton.tsx

import Button from '@/components/Button'
import { useSignOut } from '@/lib/useAuth'

export default function SignOutButton() {
  const { signOut, signingOut } = useSignOut()

  return (
    <Button variant="secondary" size="md" onClick={signOut} loading={signingOut}>
      Sign Out
    </Button>
  )
}
