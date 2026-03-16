'use client'

// src/app/shop/[slug]/ProductDetail.tsx

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import Button from '@/components/Button'
import QuantitySelector from '@/components/QuantitySelector'
import Toast from '@/components/Toast'
import { formatPrice } from '@/lib/format'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const isSoldOut = product.stock === 0

  const handleAddToCart = useCallback(() => {
    addItem(product, quantity)
    setShowToast(true)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }, [addItem, product, quantity])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main image — key causes remount for crossfade on image switch */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-border">
            <div key={selectedImage} className="animate-fade-in absolute inset-0">
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                  No image
                </div>
              )}
            </div>
            {isSoldOut && (
              <div className="absolute top-4 left-4 bg-white text-text-secondary text-sm font-medium px-3 py-1 rounded-full border border-border z-10">
                Sold Out
              </div>
            )}
          </div>

          {/* Thumbnails (only if multiple images) */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-[border-color,opacity] duration-150 ${
                    selectedImage === i
                      ? 'border-primary'
                      : 'border-border hover:border-primary/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-semibold text-text-primary">
            {product.name}
          </h1>

          <p className="mt-3 text-2xl font-medium text-primary">
            {formatPrice(product.price)}
          </p>

          <p className="mt-4 text-text-secondary leading-relaxed">
            {product.description}
          </p>

          {/* Stock indicator */}
          {!isSoldOut && product.stock <= 5 && (
            <p className="mt-3 text-sm text-warning font-medium">
              Only {product.stock} left in stock
            </p>
          )}

          {/* Quantity + Add to Cart */}
          <div className="mt-8 space-y-4">
            {!isSoldOut && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">Qty</span>
                <QuantitySelector
                  value={quantity}
                  min={1}
                  max={product.stock}
                  onChange={setQuantity}
                />
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSoldOut}
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Added to Cart
                </>
              ) : isSoldOut ? 'Sold Out' : 'Add to Cart'}
            </Button>
          </div>

          {/* Long description */}
          {product.long_description && (
            <div className="mt-10 pt-8 border-t border-border">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Details
              </h2>
              <div className="text-text-secondary leading-relaxed whitespace-pre-line text-sm">
                {product.long_description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message="Added to cart!"
          linkLabel="View cart"
          linkHref="/cart"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
