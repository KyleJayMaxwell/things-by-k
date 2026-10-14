// src/app/shop/postcards/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'
import { ProductGridSkeleton } from '@/components/skeletons'

export default function PostcardsLoading() {
  return (
    <LoadingRegion className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <Skeleton className="h-9 w-64 mb-10" />
      <ProductGridSkeleton />
    </LoadingRegion>
  )
}
