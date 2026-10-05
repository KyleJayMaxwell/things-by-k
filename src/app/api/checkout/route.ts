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
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
    const { items, destination: rawDestination } = (await request.json()) as {
      items: CheckoutItem[]
      destination?: string
    }
    const destination: Destination = rawDestination === 'international' ? 'international' : 'domestic'

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    // Get current user (optional — guest checkout is allowed)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch product details from Supabase to build line items
    const serviceClient = createServiceClient()
    const productIds = [...new Set(items.map(i => i.productId))]

    const { data: products, error } = await serviceClient
      .from('products')
      .select('id, name, description, price, images, stock, handwritten_price')
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
      if (!product) throw new Error('A product in your cart is no longer available')
      if (quantity > product.stock) throw new Error(`Not enough stock for ${product.name}`)
    }

    // Build Stripe line items
    let handwrittenCards = 0
    let packagedItems = 0
    const lineItems = items.map((item): Stripe.Checkout.SessionCreateParams.LineItem => {
      const product = products.find(p => p.id === item.productId)!

      if (item.handwritten) {
        if (product.handwritten_price == null) {
          throw new Error(`${product.name} isn't available handwritten`)
        }
        const message = (item.message ?? '').trim()
        if (!message) throw new Error(`Add a note for your handwritten ${product.name}`)
        if (message.length > HANDWRITTEN_MESSAGE_MAX) {
          throw new Error(`Handwritten notes can be up to ${HANDWRITTEN_MESSAGE_MAX} characters`)
        }
        handwrittenCards += item.quantity

        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${product.name} (Handwritten)`,
              description: `Your note: ${message}`,
              images: product.images.slice(0, 1),
              metadata: { product_id: product.id, handwritten: 'true', message },
            },
            unit_amount: product.price + product.handwritten_price,
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
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
