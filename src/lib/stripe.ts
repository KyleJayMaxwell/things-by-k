// src/lib/stripe.ts
// Stripe client — server-side only. Never import in Client Components.

import Stripe from 'stripe'

let client: Stripe | null = null

function getClient(): Stripe {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return client
}

// Created on first use rather than at import, so `next build` doesn't need the
// key (Vercel preview builds may not have it). A request without it still fails.
export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => Reflect.get(getClient(), prop),
})
