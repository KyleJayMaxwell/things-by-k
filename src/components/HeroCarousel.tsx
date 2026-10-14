'use client'

// src/components/HeroCarousel.tsx

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { HeroSlide } from '@/lib/heroSlides'

const AUTOPLAY_MS = 10000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  // null = no choice yet, so follow the reduced-motion preference
  const [userPaused, setUserPaused] = useState<boolean | null>(null)
  const [hovered, setHovered] = useState(false)
  const count = slides.length

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  const paused = userPaused ?? reducedMotion

  const go = useCallback((i: number) => setIndex((i + count) % count), [count])

  useEffect(() => {
    if (paused || hovered || count < 2) return
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [index, paused, hovered, count, go])

  // Swipe left/right on touch screens
  const [touchX, setTouchX] = useState<number | null>(null)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
    setTouchX(null)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') go(index - 1)
    if (e.key === 'ArrowRight') go(index + 1)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onKeyDown={onKeyDown}
      onTouchStart={e => setTouchX(e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Navbar is h-16; leave ~6rem of the next section peeking below the fold
      className="relative w-full h-[calc(100svh-10rem)] min-h-[420px] overflow-hidden bg-text-primary"
    >
      {slides.map((slide, i) => {
        const active = i === index
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
              active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Slow zoom while a slide is showing; snaps back only after it has faded out */}
            <div
              className={`absolute inset-0 motion-reduce:scale-100 motion-reduce:transition-none ${
                active
                  ? 'scale-105 transition-transform duration-[11000ms] ease-linear'
                  : 'scale-100 transition-transform duration-0 delay-1000'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                placeholder="blur"
                quality={90}
                // Portrait screens fill the height, so a 3:2 photo renders ~1.5x the viewport height wide
                sizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
                className="object-cover"
                style={{ objectPosition: slide.position ?? 'center' }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-20 sm:bottom-24 flex flex-col items-center gap-5 px-4 text-center">
              {slide.heading && (
                <h2 className="font-brand text-5xl sm:text-7xl text-white drop-shadow-md">
                  {slide.heading}
                </h2>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                {slide.buttons.map(b => (
                  <Link
                    key={b.href}
                    href={b.href}
                    tabIndex={active ? undefined : -1}
                    className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm sm:text-base font-medium text-white shadow-sm hover:shadow-md hover:-translate-y-px hover:bg-neutral-800 active:shadow-sm active:translate-y-0 transition-[background-color,box-shadow,transform] duration-150 focus-ring"
                  >
                    {b.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center text-white/80 hover:text-white transition-colors focus-ring rounded-full"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center text-white/80 hover:text-white transition-colors focus-ring rounded-full"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>

          <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setUserPaused(!paused)}
              aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center text-white/90 hover:text-white focus-ring rounded"
            >
              {paused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4h3v16H7zM14 4h3v16h-3z" /></svg>
              )}
            </button>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="min-w-[24px] min-h-[32px] flex items-center justify-center focus-ring rounded"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
