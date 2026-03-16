// src/app/shop/[slug]/not-found.tsx

import Link from 'next/link'
import Button from '@/components/Button'

export default function ProductNotFound() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Product not found</h1>
      <p className="text-text-secondary mb-8">This product doesn't exist or is no longer available.</p>
      <Link href="/shop">
        <Button variant="primary">
          Back to Shop
        </Button>
      </Link>
    </div>
  )
}
