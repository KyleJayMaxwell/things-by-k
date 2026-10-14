// src/lib/shopSections.ts
// Shop sections (e.g. /shop/postcards) and the link for each product.
// A category with a section lists at /shop/<section> and its products live at
// /shop/<section>/<slug>; other categories keep /shop/<slug> until they get one.

import type { ProductCategory } from '@/types'

export interface ShopSection {
  slug: string             // URL segment, e.g. 'postcards'
  category: ProductCategory
  label: string            // shown in nav, breadcrumbs and the page title
}

export const SHOP_SECTIONS: ShopSection[] = [
  { slug: 'postcards', category: 'postcard', label: 'Postcards' },
]

// Plural labels for the Shop All type filter
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  postcard: 'Postcards',
  necklace: 'Necklaces',
  zine: 'Zines',
}

export function sectionForCategory(category: ProductCategory): ShopSection | undefined {
  return SHOP_SECTIONS.find(s => s.category === category)
}

export function sectionBySlug(slug: string): ShopSection | undefined {
  return SHOP_SECTIONS.find(s => s.slug === slug)
}

export function productHref(product: { slug: string; category: ProductCategory }): string {
  const section = sectionForCategory(product.category)
  return section ? `/shop/${section.slug}/${product.slug}` : `/shop/${product.slug}`
}

// Product slugs that would be hidden behind a section page
export function isReservedSlug(slug: string): boolean {
  return SHOP_SECTIONS.some(s => s.slug === slug)
}
