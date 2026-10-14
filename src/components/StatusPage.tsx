// src/components/StatusPage.tsx
// Shared layout for the 404 and error pages: the K mark in a deep purple circle,
// a short message, and a way back into the shop

import Link from 'next/link'

// Same look as <Button>, for links and plain buttons on these pages
export const statusButtonClass =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg bg-neutral-900 text-white text-sm font-medium shadow-sm hover:bg-neutral-800 hover:shadow-md hover:-translate-y-px transition-[background-color,box-shadow,transform] duration-150 focus-ring'

interface StatusPageProps {
  eyebrow: string
  title: string
  message: React.ReactNode
  // Main action; defaults to a link to the shop
  action?: React.ReactNode
}

export default function StatusPage({ eyebrow, title, message, action }: StatusPageProps) {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 sm:py-28 flex flex-col items-center text-center animate-fade-up">
      <div aria-hidden="true" className="w-28 h-28 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/25 mb-8">
        <span className="font-brand text-7xl leading-none text-white -translate-y-[0.06em]">K</span>
      </div>
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand mb-3">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-text-primary mb-3">{title}</h1>
      <div className="text-text-secondary mb-10 max-w-md">{message}</div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        {action ?? <Link href="/shop" className={statusButtonClass}>Shop all products</Link>}
        <Link href="/" className="text-sm font-medium text-brand underline-offset-4 hover:underline">
          Go to the homepage
        </Link>
      </div>
    </div>
  )
}
