// src/app/shop/not-found.tsx

import StatusPage from '@/components/StatusPage'

export default function ProductNotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Product not found"
      message="This product doesn’t exist or is no longer available."
    />
  )
}
