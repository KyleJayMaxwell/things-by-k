// src/app/about/page.tsx

import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/Button'
import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about K and the story behind Things by K.',
}

// To add your photo: drop it in /public/about/ and set the path here,
// e.g. '/about/kyle.jpg'. A square-ish photo looks most like a real polaroid.
const ABOUT_PHOTO: string | null = null
const PHOTO_CAPTION = 'Kyle'

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-12 md:gap-16 items-start">

        {/* Polaroid */}
        <figure className="w-full max-w-[18rem] sm:max-w-sm mx-auto md:mx-0 bg-white p-4 pb-0 shadow-[0_2px_6px_rgba(26,26,46,0.08),0_18px_40px_rgba(26,26,46,0.12)] -rotate-1">
          <div className="relative aspect-square overflow-hidden bg-primary-light">
            {ABOUT_PHOTO ? (
              <Image
                src={ABOUT_PHOTO}
                alt="Kyle, the K behind Things by K"
                fill
                sizes="(min-width: 768px) 384px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-brand text-8xl leading-none text-primary/25 select-none">K</span>
              </div>
            )}
          </div>
          <figcaption className="h-20 flex items-center justify-center font-display text-4xl font-bold text-text-primary">
            {PHOTO_CAPTION}
          </figcaption>
        </figure>

        {/* Text */}
        <div className="md:pt-6">
          <p className="text-xs tracking-widest text-text-secondary uppercase mb-4">About</p>
          <h1 className="text-3xl sm:text-4xl font-light text-text-primary leading-tight mb-8">
            Original designs, made with intention and thought.
          </h1>

          <div className="space-y-5 text-text-secondary leading-relaxed">
            <p>
              <span className="font-medium text-text-primary">Things by K</span> is a small
              shop of postcards and goods designed by me, Kyle. I make things around the
              places and moments I don&apos;t want to forget, then print them in small runs
              so each one stays a little special.
            </p>
            <p>
              Every order is packed and shipped by me, usually with a note written by hand.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-xs text-text-secondary tracking-widest uppercase mb-2">Get in touch</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm text-text-primary underline underline-offset-4 hover:text-primary transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="mt-10">
            <Link href="/shop">
              <Button variant="primary" size="lg">Shop the Collection</Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
