// src/app/api/checkout/route.ts
// Creates a Stripe Checkout Session from cart items

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    // Get current user (optional — guest checkout is allowed)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch product details from Supabase to build line items
    const serviceClient = createServiceClient()
    const productIds = items.map((i: { productId: string }) => i.productId)

    const { data: products, error } = await serviceClient
      .from('products')
      .select('id, name, description, price, images, stock')
      .in('id', productIds)
      .eq('is_active', true)

    if (error || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Build Stripe line items
    const lineItems = items.map((item: { productId: string; quantity: number }) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) throw new Error(`Product ${item.productId} not found`)

      // Validate stock
      if (item.quantity > product.stock) {
        throw new Error(`Not enough stock for ${product.name}`)
      }

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 300, currency: 'usd' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
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
