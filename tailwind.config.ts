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
        primary: {
          DEFAULT: '#360F5A',
          light: '#EDE6F5',   // richer lavender tint (was #E8DFF0)
          hover: '#4A1A7A',
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
      },
    },
  },
  plugins: [],
}

export default config
