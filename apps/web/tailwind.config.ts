import type { Config } from 'tailwindcss'
import tailwindPreset from '@nagarikwatch/ui/tailwind-preset'

/**
 * apps/web Tailwind config. Pulls in the design-system preset (Civic Crimson tokens
 * mapped to utilities). Content globs cover the app, components, and the (TS-source)
 * workspace UI package.
 *
 * Tailwind v4 does not auto-discover this file. It is loaded explicitly by
 * `@config "../tailwind.config.ts"` in app/globals.css. Without that directive every
 * token utility here (text-ink, bg-surface, text-h3, border-rule, font-display) compiles
 * to nothing and elements silently fall back to unstyled 16px body text.
 *
 * No `plugins` entry: @tailwindcss/typography is not installed and the single `prose`
 * usage in the app already sets its own type via token utilities.
 */
const config: Config = {
  presets: [tailwindPreset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        // next/font exposes these as CSS variables; see app/fonts.ts. Each token
        // is already a complete stack ending in the other script, the system
        // fonts and a generic, so exactly one belongs in each list. Naming two
        // used to compile `font-display` to a 15-entry stack with 8 unreachable
        // duplicates; `pnpm audit:font-budget` now fails on a nested pair.
        devanagari: ['var(--font-devanagari)'],
        display: ['var(--font-mukta)'],
        sans: ['var(--font-source-sans)'],
      },
      fontSize: {
        // Authoritative Devanagari news scale: up to 64px display for lead headlines.
        // Line-height is tuned so stacked matras and the shirorekha never clip.
        'display-2xl': ['4rem', { lineHeight: '1.12', fontWeight: '800' }], // 64px
        'display-xl': ['3.5rem', { lineHeight: '1.14', fontWeight: '800' }], // 56px
        display: ['2.75rem', { lineHeight: '1.15', fontWeight: '700' }], // 44px
        h1: ['2rem', { lineHeight: '1.2', fontWeight: '700' }], // 32px
        h2: ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }], // 24px
        h3: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }], // 20px
        'body-lg': ['1.1875rem', { lineHeight: '1.7', fontWeight: '400' }], // 19px
        body: ['1rem', { lineHeight: '1.65', fontWeight: '400' }], // 16px
        // `text-body-sm` was in use in three components before it existed here,
        // so it compiled to nothing and those elements inherited their size.
        // 15px is the step between body copy and metadata; the leading stays
        // generous because that is what Devanagari matras need, not the size.
        'body-sm': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }], // 15px
        meta: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }], // 13px
        caption: ['0.75rem', { lineHeight: '1.35', fontWeight: '400' }], // 12px
      },
    },
  },
}

export default config
