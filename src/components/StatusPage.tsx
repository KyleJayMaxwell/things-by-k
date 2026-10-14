// src/components/StatusPage.tsx
// Shared layout for the 404 and error pages: the K mark in a black circle,
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
      {/* The site icon: the K already optically centered in a black circle */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" aria-hidden="true" className="w-28 h-28 rounded-full shadow-lg shadow-black/20 mb-8" />
      <p className="text-xs font-semibold tracking-[0.2em] uppercase text-text-secondary mb-3">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-text-primary mb-3">{title}</h1>
      <div className="text-text-secondary mb-10 max-w-md">{message}</div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
        {action ?? <Link href="/shop" className={statusButtonClass}>Shop all products</Link>}
        <Link href="/" className="text-sm font-medium text-text-primary underline-offset-4 hover:underline">
          Go to the homepage
        </Link>
      </div>
    </div>
  )
}
