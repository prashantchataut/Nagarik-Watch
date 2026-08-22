import { Mukta, Noto_Sans_Devanagari, Source_Sans_3 } from 'next/font/google'

export const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-mukta-face',
  preload: true,
})

export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-devanagari-face',
  preload: true,
})

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-source-sans-face',
  preload: true,
})

export const fontVariables = `${mukta.variable} ${notoDevanagari.variable} ${sourceSans.variable}`
