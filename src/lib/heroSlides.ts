// src/lib/heroSlides.ts
//
// Homepage hero carousel slides. To swap a photo, replace the file in
// src/assets/hero/ (keep the same name) or point the import at a new file.

import type { StaticImageData } from 'next/image'
import bayBridge from '@/assets/hero/bay-bridge.jpg'
import goldenGateFog from '@/assets/hero/golden-gate-fog.jpg'

export interface HeroSlide {
  id: string
  image: StaticImageData
  alt: string
  // CSS object-position, e.g. '25% center' to keep the subject in frame on phones
  position?: string
  // Optional headline over the image; omit for a photo-only slide
  heading?: string
  buttons: { label: string; href: string }[]
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'shop',
    image: bayBridge,
    alt: 'Bay Bridge over the water on a clear day',
    buttons: [{ label: 'Shop All Products', href: '/shop' }],
  },
  {
    id: 'about',
    image: goldenGateFog,
    alt: 'Golden Gate Bridge tower in the fog',
    // Anchor near the top so the tower isn't cropped off on wide screens
    position: '20% 15%',
    buttons: [{ label: 'About Things by K', href: '/about' }],
  },
]
