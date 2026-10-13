// src/app/shop/postcards/[slug]/page.tsx

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/ProductDetail'
import { getActiveProduct } from '@/lib/productPage'

interface Props {
  params: Promise<{ slug: string }>
}

async function loadPostcard(slug: string) {
  const product = await getActiveProduct(slug)
  return product?.category === 'postcard' ? product : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await loadPostcard((await params).slug)
  if (!product) return { title: 'Product Not Found' }
  return { title: product.name, description: product.description }
}

export default async function PostcardPage({ params }: Props) {
  const product = await loadPostcard((await params).slug)
  if (!product) notFound()

  return (
    <ProductDetail
      product={product}
      breadcrumbs={[
        { label: 'Shop', href: '/shop' },
        { label: 'Postcards', href: '/shop/postcards' },
        { label: product.name },
      ]}
    />
  )
}
