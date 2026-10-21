'use client'

// src/components/FadeImage.tsx

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

// next/image that shows a soft pulsing placeholder until the photo arrives, then fades it in.
// Use inside a positioned container (same as a `fill` Image).
export default function FadeImage({ alt, className = '', onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  // Callers with their own transition (e.g. hover zoom) must include opacity in it
  const transition = className.includes('transition') ? '' : 'transition-opacity duration-500'

  return (
    <>
      {!loaded && <span className="absolute inset-0 animate-pulse motion-reduce:animate-none bg-muted/70" aria-hidden="true" />}
      <Image
        {...props}
        alt={alt}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        className={`${className} ${transition} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}
