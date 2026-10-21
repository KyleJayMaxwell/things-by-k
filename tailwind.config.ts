// tailwind.config.ts
import type { Config } from 'tailwindcss'

// Theme colors are CSS variables holding RGB channels, so Tailwind opacity modifiers (bg-primary/30) still work
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`

const config: Config = {
  // .dark on <html> switches themes; .theme-light keeps a subtree (the admin) light either way
  darkMode: ['variant', '&:is(.dark *):not(:is(.theme-light *))'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Things by K color tokens ──
        // Palette from a Japanese color book. Ayame-iro purple is reserved for the nav bar;
        // everything else is black/neutral. Botan-nezumi and Fuji-nezumi are quiet accents only.
        // Values live in globals.css as RGB channels so each theme (light/dark) can swap them.
        brand: '#5F4489',             // 菖蒲色 Ayame-iro (Red Violet) — same in both themes, white text 7.9:1
        botan: token('botan'),        // 牡丹鼠 Botan-nezumi (dusty rose) — link hover, focus ring, nav seam
        fuji: '#6E6A6A',              // 藤鼠 Fuji-nezumi (warm grey)
        primary: {
          DEFAULT: token('primary'),  // solid buttons: black in light, soft white in dark
          light: token('primary-light'),
          hover: token('primary-hover'),
        },
        'on-primary': token('on-primary'), // text on solid primary buttons
        muted: token('muted'),        // skeleton/loading fills
        accent: '#8B6914',            // warm gold — 5.1:1 on white, pairs with purple
        background: token('background'),
        surface: token('surface'),
        'text-primary': token('text-primary'),
        'text-secondary': token('text-secondary'),
        border: token('border'),
        success: token('success'),
        error: token('error'),
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
