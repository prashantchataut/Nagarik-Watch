import { Inter, Mukta, Noto_Sans_Devanagari } from 'next/font/google'

/**
 * Self-hosted Google Fonts via next/font (no external request at runtime, no layout shift).
 * Choices per DESIGN.md §3:
 *  - Mukta: Devanagari + Latin display (headlines).
 *  - Noto Sans Devanagari: Devanagari body (best Nepali matra/conjunct coverage).
 *  - Inter: Latin body / UI numbers.
 * Each exposes a CSS variable consumed by tailwind.config.ts and globals.css.
 */
export const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-mukta',
  display: 'swap',
})

export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
})

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

/** All font className variables, applied once on <html> in the root layout. */
export const fontVariables = `${mukta.variable} ${notoDevanagari.variable} ${inter.variable}`
