// src/app/account/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'
import { CardListSkeleton } from '@/components/skeletons'

export default function AccountLoading() {
  return (
    <LoadingRegion className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-56 mb-10" />
      <CardListSkeleton rows={2} />
    </LoadingRegion>
  )
}
