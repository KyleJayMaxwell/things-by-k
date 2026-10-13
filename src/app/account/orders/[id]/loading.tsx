// src/app/account/orders/[id]/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'

export default function OrderDetailLoading() {
  return (
    <LoadingRegion className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Skeleton className="h-4 w-16 mb-8" />
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-32 mb-8" />
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
