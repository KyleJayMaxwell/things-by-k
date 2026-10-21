// src/app/about/page.tsx

import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about K and the story behind Things by K.',
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 md:gap-16 items-start">

        {/* Placeholder photo (to be replaced with a scanned polaroid) */}
        <div className="w-full max-w-sm mx-auto md:mx-0 aspect-[3/4] bg-primary-light relative overflow-hidden rounded-sm shadow-[0_2px_6px_rgba(26,26,46,0.08),0_16px_36px_rgba(26,26,46,0.12)] flex items-center justify-center">
          <p className="text-xs text-text-secondary tracking-widest uppercase">Photo coming soon</p>
        </div>

        {/* Text */}
        <div className="md:pt-6">
          <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">About</p>
          <h1 className="text-3xl sm:text-4xl font-light text-text-primary leading-tight mb-8">
            Original designs, made with intention and thought.
          </h1>

          <p className="text-text-secondary leading-relaxed">
            <span className="font-medium text-text-primary">Things by K</span> is a small
            shop of original designs. Each piece starts as an idea worth slowing down for
            and is made in small runs, and every order is packed and shipped by me.
          </p>

          <div className="mt-8 md:mt-10">
            <p className="text-xs text-text-secondary tracking-widest uppercase mb-2">Contact</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-text-primary underline underline-offset-4 hover:text-botan transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
