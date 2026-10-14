// src/app/shop/postcards/[slug]/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'

export default function ProductLoading() {
  return (
    <LoadingRegion className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 sm:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-24" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg mt-6" />
        </div>
      </div>
    </LoadingRegion>
  )
}
