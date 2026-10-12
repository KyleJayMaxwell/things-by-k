// src/app/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Button from '@/components/Button'
import FadeIn from '@/components/FadeIn'
import HeroCarousel from '@/components/HeroCarousel'
import { heroSlides } from '@/lib/heroSlides'
import { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Things by K — Original designs',
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
      <HeroCarousel slides={heroSlides} />

      {/* Featured Products — scroll-triggered */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <FadeIn className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Featured</h2>
            <p className="text-text-secondary mt-1">Fresh from the studio.</p>
          </div>
          <Link href="/shop" className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
            View all →
          </Link>
        </FadeIn>

        {featured.length === 0 ? (
          <FadeIn>
            <div className="text-center py-16 text-text-secondary">
              <p>Products coming soon — check back shortly!</p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product, i) => (
              <FadeIn key={product.id} delay={i * 60}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        )}
      </section>

      {/* About Teaser — scroll-triggered */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col sm:flex-row items-center gap-10">
          <FadeIn className="flex-1">
            <h2 className="font-brand text-4xl text-text-primary mb-3">Things by K</h2>
            <p className="text-text-secondary leading-relaxed max-w-lg">
              A small shop of original designs. Every piece is designed with
              intention and thought.
            </p>
            <Link href="/about" className="inline-block mt-6">
              <Button variant="black" size="md">Learn More</Button>
            </Link>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0">
              <span className="font-brand text-6xl sm:text-8xl leading-none -translate-y-[0.17em] text-white select-none">K</span>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
