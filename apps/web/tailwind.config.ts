import type { Config } from 'tailwindcss'
import tailwindPreset from '@nagarikwatch/ui/tailwind-preset'

/**
 * apps/web Tailwind config. Pulls in the design-system preset (Civic Crimson tokens mapped
 * to utilities) and adds the prose plugin for article bodies. Content globs cover the app,
 * components, and the (TS-source) workspace UI package.
 */
const config: Config = {
  presets: [tailwindPreset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    './apps/web/app/**/*.{ts,tsx}',
    './apps/web/components/**/*.{ts,tsx}',
    './apps/web/lib/**/*.{ts,tsx}',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        // next/font exposes these as CSS variables; see app/fonts.ts.
        devanagari: ['var(--font-devanagari)', 'var(--font-mukta)', 'sans-serif'],
        display: ['var(--font-mukta)', 'var(--font-devanagari)', 'sans-serif'],
        sans: ['var(--font-source-sans)', 'var(--font-devanagari)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Authoritative Devanagari news scale: up to 64px display for lead headlines.
        // Line-height is tuned for matras (ि, ी, ु, ू, े, ै, ो, ौ, ं) to never clip.
        'display-2xl': ['4rem', { lineHeight: '1.12', fontWeight: '800' }], // 64px
        'display-xl': ['3.5rem', { lineHeight: '1.14', fontWeight: '800' }], // 56px
        display: ['2.75rem', { lineHeight: '1.15', fontWeight: '700' }], // 44px
        h1: ['2rem', { lineHeight: '1.2', fontWeight: '700' }], // 32px
        h2: ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }], // 24px
        h3: ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }], // 20px
        'body-lg': ['1.1875rem', { lineHeight: '1.7', fontWeight: '400' }], // 19px
        body: ['1rem', { lineHeight: '1.65', fontWeight: '400' }], // 16px
        meta: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }], // 13px
        caption: ['0.75rem', { lineHeight: '1.35', fontWeight: '400' }], // 12px
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.ink.DEFAULT'),
            '--tw-prose-headings': theme('colors.ink.DEFAULT'),
            '--tw-prose-links': theme('colors.brand.DEFAULT'),
            '--tw-prose-bold': theme('colors.ink.DEFAULT'),
            '--tw-prose-quotes': theme('colors.ink.soft'),
            '--tw-prose-quote-borders': theme('colors.brand.tint'),
            maxWidth: 'var(--body-max)',
            fontFamily: theme('fontFamily.devanagari').toString(),
            fontSize: '1.1875rem',
            lineHeight: '1.7',
            a: { textDecoration: 'none', fontWeight: '600' },
            'a:hover': { color: theme('colors.brand.strong') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
