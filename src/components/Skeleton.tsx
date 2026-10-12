// src/components/Skeleton.tsx

interface SkeletonProps {
  className?: string
}

// Neutral pulsing block used as a placeholder while content loads
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse motion-reduce:animate-none rounded-md bg-neutral-200/70 ${className}`} aria-hidden="true" />
}

// Wraps a page's skeleton so screen readers hear one "Loading" instead of empty blocks
export function LoadingRegion({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}
