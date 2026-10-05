'use client'

// src/app/shop/[slug]/ProductDetail.tsx

import Image from 'next/image'
import { useState, useCallback } from 'react'
import { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import Button from '@/components/Button'
import QuantitySelector from '@/components/QuantitySelector'
import Toast from '@/components/Toast'
import ImageLightbox from '@/components/ImageLightbox'
import { formatPrice } from '@/lib/format'
import { HANDWRITTEN_MESSAGE_MAX, offersHandwritten } from '@/lib/cart'
import { HANDWRITTEN_POSTCARD_RATES } from '@/lib/shipping'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showToast, setShowToast] = useState(false)
  const [added, setAdded] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [handwritten, setHandwritten] = useState(false)
  const [message, setMessage] = useState('')
  const { addItem } = useCart()

  const isSoldOut = product.stock === 0
  const canHandwrite = offersHandwritten(product)
  const price = product.price + (handwritten ? product.handwritten_price ?? 0 : 0)
  const needsMessage = handwritten && message.trim().length === 0

  const handleAddToCart = useCallback(() => {
    addItem(product, quantity, { handwritten, message })
    setShowToast(true)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }, [addItem, product, quantity, handwritten, message])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main image — key causes remount for crossfade on image switch */}
          <div className="aspect-square relative rounded-xl overflow-hidden bg-gray-50 border border-border">
            <div key={selectedImage} className="animate-fade-in absolute inset-0">
              {product.images[selectedImage] ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="View full size image"
                  className="group absolute inset-0 cursor-zoom-in"
                >
                  {/* object-contain so tall or wide photos show in full instead of being cropped */}
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-contain"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/90 border border-border text-text-primary flex items-center justify-center shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      <path d="M8 5.5a.75.75 0 01.75.75v1h1a.75.75 0 010 1.5h-1v1a.75.75 0 01-1.5 0v-1h-1a.75.75 0 010-1.5h1v-1A.75.75 0 018 5.5z" />
                    </svg>
                  </span>
                </button>
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
            {formatPrice(price)}
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

          {/* Blank or handwritten */}
          {canHandwrite && !isSoldOut && (
            <fieldset className="mt-8">
              <legend className="text-sm text-text-secondary mb-3">Choose</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: false,
                    title: 'Blank',
                    price: product.price,
                    detail: 'Ships to you in a protective envelope or box.',
                  },
                  {
                    value: true,
                    title: 'Handwritten',
                    price: product.price + (product.handwritten_price ?? 0),
                    detail: `I write your note, or a surprise for you, and mail it as a real postcard. Postage from ${formatPrice(HANDWRITTEN_POSTCARD_RATES.domestic)}.`,
                  },
                ].map(option => (
                  <button
                    key={option.title}
                    type="button"
                    aria-pressed={handwritten === option.value}
                    onClick={() => setHandwritten(option.value)}
                    className={`text-left p-4 rounded-xl border transition-colors focus-ring ${
                      handwritten === option.value
                        ? 'border-primary bg-primary-light'
                        : 'border-border bg-white hover:border-primary/40'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-text-primary">{option.title}</span>
                      <span className="text-sm text-text-primary">{formatPrice(option.price)}</span>
                    </span>
                    <span className="block mt-1 text-xs text-text-secondary leading-relaxed">{option.detail}</span>
                  </button>
                ))}
              </div>

              {handwritten && (
                <div className="mt-4">
                  <label htmlFor="handwritten-message" className="block text-sm font-medium text-text-primary mb-1.5">
                    What should I write?
                  </label>
                  <textarea
                    id="handwritten-message"
                    value={message}
                    onChange={e => setMessage(e.target.value.slice(0, HANDWRITTEN_MESSAGE_MAX))}
                    rows={5}
                    placeholder={'Sending it to someone? Write your message, like "Dear Sam, wish you were here for the fog..."\n\nSending it to yourself? Give me a little inspiration (a favorite place, a memory, something you need to hear) and I\'ll write you a surprise.'}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
                  />
                  <p className="mt-1.5 flex justify-between text-xs text-text-secondary">
                    <span>It's mailed to the shipping address you enter at checkout. Send a pick-me-up to a friend, or treat yourself to something fun in the mailbox instead of bills.</span>
                    <span className="flex-shrink-0 ml-3">{message.length}/{HANDWRITTEN_MESSAGE_MAX}</span>
                  </p>
                </div>
              )}
            </fieldset>
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
              disabled={isSoldOut || needsMessage}
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

      {/* Full screen image viewer */}
      {lightboxOpen && product.images.length > 0 && (
        <ImageLightbox
          images={product.images}
          alt={product.name}
          index={selectedImage}
          onIndexChange={setSelectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

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
