'use client'

// src/components/admin/useListNav.ts
// Client-side counterpart of listHref: updates the current URL's params in a transition

import { useCallback, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { listHref, type SearchParams } from '@/lib/listParams'

export function useListNav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const setParams = useCallback((changes: Record<string, string | null>) => {
    const current: SearchParams = Object.fromEntries(searchParams.entries())
    startTransition(() => {
      router.replace(listHref(pathname, current, changes), { scroll: false })
    })
  }, [router, pathname, searchParams])

  return { setParams, pending, searchParams }
}
