// src/app/layout.tsx

import type { Metadata } from 'next'
import { Inter, Amatic_SC } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CartProvider } from '@/context/CartContext'
import { themeInitScript } from '@/lib/theme'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const amaticSC = Amatic_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-amatic',
  display: 'swap',
})

// Gothic blackletter for brand marks only (wordmark, "Made by K", K logo)
const oldLondon = localFont({
  src: '../fonts/OldLondon.ttf',
  variable: '--font-brand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Things by K',
    template: '%s | Things by K',
  },
  description: 'Original designs by K.',
  openGraph: {
    title: 'Things by K',
    description: 'Original designs by K.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script adds .dark before React loads, so <html>'s class can differ from the server's
    <html lang="en" className={`${inter.variable} ${amaticSC.variable} ${oldLondon.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background text-text-primary antialiased min-h-screen flex flex-col">
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-lg focus:text-sm focus:font-medium"
          >
            Skip to content
          </a>
          <Navbar />
          {/* tabIndex lets the skip link move keyboard focus here, not just scroll */}
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
