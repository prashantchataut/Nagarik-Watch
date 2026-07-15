import { Mukta, Noto_Sans_Devanagari, Source_Sans_3 } from 'next/font/google'

/**
 * Self-hosted Google Fonts via next/font (no external request at runtime, no layout shift).
 *  - Mukta: Devanagari + Latin display (headlines) — news masthead voice.
 *  - Noto Sans Devanagari: Devanagari body (best Nepali matra/conjunct coverage).
 *  - Source Sans 3: Latin UI / English body (editorial, not generic Inter).
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

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

/** All font className variables, applied once on <html> in the root layout. */
export const fontVariables = `${mukta.variable} ${notoDevanagari.variable} ${sourceSans.variable}`
