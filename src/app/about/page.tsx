// src/app/about/page.tsx

import Link from 'next/link'
import Button from '@/components/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about K and the story behind Things by K.',
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">

      {/* Brand mark */}
      <div className="w-24 h-24 rounded-full bg-primary-light flex items-center justify-center mb-8">
        <span className="text-4xl font-semibold text-primary select-none">K</span>
      </div>

      <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">About</p>
      <h1 className="text-4xl sm:text-5xl font-light text-text-primary leading-tight mb-10">
        Small-batch, made with care.<br />
        Each piece is created by hand<br />
        or captured through a lens.
      </h1>

      {/* Photo + Process */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 items-start mb-12">

        {/* Placeholder photo */}
        <div className="aspect-[3/4] bg-primary-light relative overflow-hidden rounded-sm flex items-center justify-center">
          <p className="text-xs text-text-secondary tracking-widest uppercase">Photo coming soon</p>
        </div>

        {/* Process */}
        <div className="space-y-5 pt-2">
          <h2 className="font-medium text-text-primary">The process</h2>
          <div className="space-y-4 text-text-secondary text-sm leading-relaxed">
            <p>
              Everything in this shop starts with an idea — something worth making slowly,
              with intention. Whether it&apos;s a print pulled from an original photograph
              or a handmade object, nothing here is mass-produced.
            </p>
            <p>
              I work in small batches so that each piece gets the attention it deserves.
              When something sells out, it&apos;s gone — or it comes back in a slightly
              different form.
            </p>
            <p>
              Things by K is a one-person studio. Every order is packed and shipped by me.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-text-secondary tracking-widest uppercase mb-2">Get in touch</p>
            <a
              href="mailto:kylejaymaxwell@gmail.com"
              className="text-sm text-text-primary underline underline-offset-4 hover:text-primary transition-colors"
            >
              kylejaymaxwell@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p className="text-text-secondary text-sm">Ready to find something you&apos;ll love?</p>
        <Link href="/shop">
          <Button variant="primary" size="lg">Shop the Collection</Button>
        </Link>
      </div>

    </div>
  )
}