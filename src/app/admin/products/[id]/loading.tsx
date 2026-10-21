// src/app/admin/products/[id]/loading.tsx

import Skeleton, { LoadingRegion } from '@/components/Skeleton'

export default function EditProductLoading() {
  return (
    <LoadingRegion>
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="bg-surface border border-border rounded-xl p-6 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
