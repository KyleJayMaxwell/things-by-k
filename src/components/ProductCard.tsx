'use client'

// src/components/ProductCard.tsx

import Link from 'next/link'
import Image from 'next/image'
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images[0]

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block bg-surface rounded-xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-200"
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
            No image
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-sm font-medium text-text-secondary bg-white px-3 py-1 rounded-full border border-border">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-text-secondary text-sm">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
