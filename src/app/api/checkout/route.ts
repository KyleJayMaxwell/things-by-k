// src/app/api/checkout/route.ts
// Creates a Stripe Checkout Session from cart items

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { HANDWRITTEN_MESSAGE_MAX } from '@/lib/cart'
import { shippingQuote, INTERNATIONAL_COUNTRIES, type Destination } from '@/lib/shipping'

interface CheckoutItem {
  productId: string
  quantity: number
  handwritten?: boolean
  message?: string
}

const MAX_LINES = 50
const MAX_QUANTITY = 99

// A problem with the cart the customer can fix; its message is safe to show them
class CartError extends Error {}

function isValidItem(item: unknown): item is CheckoutItem {
  if (!item || typeof item !== 'object') return false
  const { productId, quantity, handwritten, message } = item as Record<string, unknown>
  return typeof productId === 'string' && productId.length > 0
    && Number.isInteger(quantity) && (quantity as number) >= 1 && (quantity as number) <= MAX_QUANTITY
    && (handwritten === undefined || typeof handwritten === 'boolean')
    && (message === undefined || typeof message === 'string')
}

// Simple in-memory rate limiter — max 5 checkout attempts per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }

  if (entry.count >= 5) return true

  entry.count++
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many checkout attempts. Please wait a minute and try again.' }, { status: 429 })
  }
  try {
    const body = await request.json().catch(() => null)
    const rawItems: unknown = body?.items
    const rawDestination: unknown = body?.destination
    const destination: Destination = rawDestination === 'international' ? 'international' : 'domestic'

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
    }
    if (rawItems.length > MAX_LINES || !rawItems.every(isValidItem)) {
      return NextResponse.json({ error: 'Something in your cart looks off. Please remove it and add it again.' }, { status: 400 })
    }
    const items: CheckoutItem[] = rawItems

    // Get current user (optional — guest checkout is allowed)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch product details from Supabase to build line items
    const serviceClient = createServiceClient()
    const productIds = [...new Set(items.map(i => i.productId))]

    const { data: products, error } = await serviceClient
      .from('products')
      .select('id, name, description, price, images, stock, category, handwritten_price')
      .in('id', productIds)
      .eq('is_active', true)

    if (error || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Validate stock across all lines of the same product (blank + handwritten)
    const requested = new Map<string, number>()
    for (const item of items) {
      requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity)
    }
    for (const [productId, quantity] of requested) {
      const product = products.find(p => p.id === productId)
      if (!product) throw new CartError('A product in your cart is no longer available. Please remove it.')
      if (quantity > product.stock) throw new CartError(`Only ${product.stock} of ${product.name} left. Please lower the quantity.`)
    }

    // Build Stripe line items
    let handwrittenCards = 0
    let packagedItems = 0
    const lineItems = items.map((item): Stripe.Checkout.SessionCreateParams.LineItem => {
      const product = products.find(p => p.id === item.productId)!

      if (item.handwritten) {
        if (product.category !== 'postcard') {
          throw new CartError(`${product.name} isn’t available handwritten`)
        }
        // A blank note means K freestyles the card
        const message = (item.message ?? '').trim()
        if (message.length > HANDWRITTEN_MESSAGE_MAX) {
          throw new CartError(`Handwritten notes can be up to ${HANDWRITTEN_MESSAGE_MAX} characters`)
        }
        handwrittenCards += item.quantity

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.name} (Handwritten)`,
              description: message ? `Your note: ${message}` : 'No note given: K will freestyle it',
              images: product.images.slice(0, 1),
              metadata: { product_id: product.id, handwritten: 'true', message },
            },
            unit_amount: product.price + (product.handwritten_price ?? 0),
          },
          quantity: item.quantity,
        }
      }

      packagedItems += item.quantity
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
            images: product.images.slice(0, 1), // Stripe allows up to 8
            metadata: { product_id: product.id },
          },
          unit_amount: product.price, // already in cents
        },
        quantity: item.quantity,
      }
    })

    const shipping = shippingQuote(destination, handwrittenCards, packagedItems)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: destination === 'domestic' ? ['US'] : [...INTERNATIONAL_COUNTRIES],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shipping.amount, currency: 'usd' },
            display_name: shipping.label,
          },
        },
      ],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        // Pass user_id if logged in so webhook can link order to account
        user_id: user?.id ?? '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    // Stripe and database errors can be technical, so the customer gets a plain message
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'We couldn’t start checkout. Please try again in a moment.' }, { status: 500 })
  }
}
