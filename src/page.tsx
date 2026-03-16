// src/app/page.tsx
// Landing page — hero, featured products, about teaser

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Button from '@/components/Button'
import { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Things by K — Handmade goods & original photography',
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const featured: Product[] = products ?? []

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #ffffff 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #a78bfa 0%, transparent 40%)`
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-28 sm:py-36 flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight leading-tight">
            Handmade goods &<br className="hidden sm:block" /> original photography
          </h1>
          <p className="text-primary-light text-lg sm:text-xl max-w-xl">
            Small-batch, made with care. Each piece is created by hand or captured through a lens.
          </p>
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center px-8 py-3.5 bg-white text-primary font-semibold rounded-lg hover:bg-primary-light transition-colors text-base"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Featured</h2>
            <p className="text-text-secondary mt-1">Fresh from the studio.</p>
          </div>
          <Link href="/shop" className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
            View all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <p>Products coming soon — check back shortly!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── About Teaser ──────────────────────────────────── */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-text-primary mb-3">Made by Kial</h2>
            <p className="text-text-secondary leading-relaxed max-w-lg">
              Things by K is a small shop for handmade goods and original photography.
              Every item is made with intention — from the photo framed just right to the
              jewelry assembled piece by piece.
            </p>
            <Link href="/about" className="inline-block mt-6">
              <Button variant="secondary" size="md">Learn More</Button>
            </Link>
          </div>
          <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
            <span className="text-5xl sm:text-7xl font-semibold text-primary select-none">K</span>
          </div>
        </div>
      </section>
    </div>
  )
}
