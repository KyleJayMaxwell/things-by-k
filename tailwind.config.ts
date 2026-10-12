// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Things by K color tokens ──
        // Deep purple is reserved for the nav bar; everything else is black/neutral
        brand: '#360F5A',
        primary: {
          DEFAULT: '#171717', // neutral-900 (was purple #360F5A)
          light: '#F5F5F5',   // neutral-100 (was lavender #EDE6F5)
          hover: '#262626',   // neutral-800
        },
        accent: '#8B6914',            // warm gold — 5.1:1 on white, pairs with purple
        background: '#FAF9FC',        // barely purple-tinted (was #FAFAFA)
        surface: '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B6A80',  // purple-tinted gray — 5.2:1 on white (was #6B7280)
        border: '#E4E0EF',            // barely purple-tinted (was #E5E7EB)
        success: '#059669',
        error: '#DC2626',
        warning: '#D97706',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-amatic)', 'cursive'],
        brand: ['var(--font-brand)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
