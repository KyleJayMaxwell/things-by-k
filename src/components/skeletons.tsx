// src/components/skeletons.tsx
// Page-shaped placeholders shown by loading.tsx files while server data loads

import Skeleton, { LoadingRegion } from './Skeleton'

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col bg-surface rounded-xl overflow-hidden border border-border">
          <Skeleton className="aspect-square rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Stacked cards, e.g. account links and order history
export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

// Admin list tables (orders, products)
export function AdminTableSkeleton({ title = true, rows = 6 }: { title?: boolean; rows?: number }) {
  return (
    <LoadingRegion>
      {title && <Skeleton className="h-8 w-40 mb-8" />}
      <div className="bg-white border border-border rounded-xl overflow-hidden divide-y divide-border">
        <div className="px-5 py-3">
          <Skeleton className="h-3 w-1/2" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
