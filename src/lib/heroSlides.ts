// src/lib/heroSlides.ts
//
// Homepage hero carousel slides. To swap a photo, replace the file in
// src/assets/hero/ (keep the same name) or point the import at a new file.

import type { StaticImageData } from 'next/image'
import shopImage from '@/assets/hero/shop.jpg'
import aboutImage from '@/assets/hero/about.jpg'

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
    image: shopImage,
    alt: 'Foggy Golden Gate Bridge postcard print',
    position: '20% center',
    buttons: [{ label: 'Shop All Products', href: '/shop' }],
  },
  {
    id: 'about',
    image: aboutImage,
    alt: 'Postcard design, front and back',
    heading: 'Designed by K',
    buttons: [{ label: 'About Things by K', href: '/about' }],
  },
]
