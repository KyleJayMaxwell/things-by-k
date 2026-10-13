// src/app/shop/[slug]/page.tsx
// Products whose category doesn't have its own section yet (postcards live at /shop/postcards/<slug>)

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/ProductDetail'
import { getActiveProduct } from '@/lib/productPage'
import { sectionForCategory } from '@/lib/shopSections'

interface Props {
  params: Promise<{ slug: string }>
}

async function loadProduct(slug: string) {
  const product = await getActiveProduct(slug)
  return product && !sectionForCategory(product.category) ? product : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await loadProduct((await params).slug)
  if (!product) return { title: 'Product Not Found' }
  return { title: product.name, description: product.description }
}

export default async function ProductPage({ params }: Props) {
  const product = await loadProduct((await params).slug)
  if (!product) notFound()

  return <ProductDetail product={product} breadcrumbs={[{ label: 'Shop', href: '/shop' }, { label: product.name }]} />
}
