'use client'

// src/components/CartItem.tsx

import Image from 'next/image'
import Link from 'next/link'
import { CartItem as CartItemType } from '@/types'
import { useCart } from '@/context/CartContext'
import QuantitySelector from './QuantitySelector'
import { formatPrice } from '@/lib/format'

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const { product, quantity } = item
  const lineTotal = product.price * quantity

  return (
    <div className="flex gap-4 py-6 border-b border-border last:border-0">
      {/* Thumbnail */}
      <Link href={`/shop/${product.slug}`} className="flex-shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 relative rounded-lg overflow-hidden bg-gray-50 border border-border">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/shop/${product.slug}`} className="font-medium text-text-primary hover:text-primary transition-colors truncate">
            {product.name}
          </Link>
          <span className="font-medium text-text-primary flex-shrink-0">
            {formatPrice(lineTotal)}
          </span>
        </div>

        <p className="mt-1 text-sm text-text-secondary">
          {formatPrice(product.price)} each
        </p>

        <div className="mt-3 flex items-center gap-4">
          <QuantitySelector
            value={quantity}
            min={1}
            max={product.stock}
            onChange={(val) => updateQuantity(product.id, val)}
          />
          <button
            onClick={() => removeItem(product.id)}
            className="min-h-[44px] px-2 text-sm text-text-secondary hover:text-error transition-colors focus-ring rounded"
            aria-label={`Remove ${product.name} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}
