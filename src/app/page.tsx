// src/app/page.tsx

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LoadError from '@/components/LoadError'
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

  const { data: products, error: productsError } = await supabase
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

        {productsError ? (
          <LoadError message="We couldn’t load products just now. Please try again." className="py-16" />
        ) : featured.length === 0 ? (
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
              {/* Old London "K" as an SVG path so it centers the same in every browser (font line metrics vary by OS) */}
              <svg viewBox="0 0 673 671" className="w-1/3 h-1/3 text-white" fill="currentColor" aria-hidden="true">
                <path d="M673 561 659 548 631 574 550 444Q507 374 434 334Q476 299 516.0 267.0Q556 235 598 206L495 91Q421 165 333 226Q333 107 391 0H374Q314 101 314 214V395Q314 489 256 535Q254 537 220.5 555.0Q187 573 123 608L112 600Q156 563 181.5 540.0Q207 517 215 509Q265 453 265 389V189Q265 106 318 8V1Q265 20 239 20Q233 20 220.5 18.0Q208 16 188 12Q149 3 125 3Q19 3 0 135L3 136Q37 82 95 82L168 87Q202 89 280 40L282 44Q220 91 195 131Q164 180 164 249Q137 236 106 236Q54 236 31 295Q65 285 82 285L100 287Q139 291 158 333Q173 366 173 410Q144 394 109 394Q63 394 53 446Q77 435 92 435Q123 435 133 469L136 496Q136 542 97 585Q74 609 56.5 627.0Q39 645 28 656L40 671Q71 661 95.0 654.5Q119 648 137 643Q186 632 218 632Q287 632 385 671L491 550Q504 573 513.5 588.5Q523 604 530 614Q541 630 551.5 644.0Q562 658 573 670ZM491 262Q450 293 417 321L346 381L333 380V250L423 184ZM480 529 436 579Q367 548 279 548L266 546Q323 494 333 410L336 409Q385 409 423 447Q434 458 448.5 479.0Q463 500 480 529Z" />
              </svg>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
