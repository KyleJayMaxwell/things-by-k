// src/app/account/orders/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'
import { CardListSkeleton } from '@/components/skeletons'

export default function OrdersLoading() {
  return (
    <LoadingRegion className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Skeleton className="h-9 w-56 mb-8" />
      <CardListSkeleton rows={4} />
    </LoadingRegion>
  )
}
