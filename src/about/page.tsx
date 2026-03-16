// src/app/about/page.tsx
// Static page — hardcoded content, no DB calls needed

import Link from 'next/link'
import Button from '@/components/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Kial and the story behind Things by K.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Avatar / brand mark */}
      <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center mb-8">
        <span className="text-4xl font-semibold text-primary select-none">K</span>
      </div>

      <h1 className="text-4xl font-semibold text-text-primary mb-6">About</h1>

      <div className="prose prose-neutral max-w-none space-y-5 text-text-secondary leading-relaxed">
        <p className="text-lg text-text-primary">
          Hi, I'm Kial — the maker behind Things by K.
        </p>

        <p>
          Things by K started as a way to share the things I make and the places I see.
          Photography has always been how I slow down and notice the world, and handmaking
          things — jewelry, objects, small goods — is how I stay grounded.
        </p>

        <p>
          Every item in this shop is made or photographed by me. The postcards are printed
          from my own photos. The necklaces are assembled by hand. The zines are laid out,
          printed, and folded myself.
        </p>

        <p>
          I'm also a developer, and this shop is a full-stack project I built from scratch —
          so if you're curious about how it works under the hood, I'm always happy to talk tech.
        </p>

        <p>
          Thanks for stopping by.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
        <Link href="/shop">
          <Button variant="primary" size="lg">Shop the Collection</Button>
        </Link>
      </div>
    </div>
  )
}
