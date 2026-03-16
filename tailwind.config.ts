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
        // ── Things by K color tokens (PRD Section 2) ──
        primary: {
          DEFAULT: '#360F5A',
          light: '#E8DFF0',
          hover: '#4A1A7A',
        },
        background: '#FAFAFA',
        surface: '#FFFFFF',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        success: '#059669',
        error: '#DC2626',
        warning: '#D97706',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
