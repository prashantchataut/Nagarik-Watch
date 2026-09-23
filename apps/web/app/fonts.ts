import { Mukta, Noto_Sans_Devanagari, Source_Sans_3 } from 'next/font/google'

/**
 * Three families. The weight lists are load-bearing, in two different ways.
 *
 * Noto Sans Devanagari and Source Sans 3 ship variable versions, so omitting
 * `weight` declares one face spanning the whole axis instead of one per listed
 * weight. Measured, this costs nothing: Google serves the same binaries either
 * way, and the emitted media set is byte-identical (733.5 KB / 25 files before
 * and after). What changes is fidelity. `font-black` (900) appears 54 times
 * across the app, and the stylesheets ask for 650, 720, 750, 850 and 880 --
 * weights that only exist on an axis. Against the previous static
 * 400/500/600/700 lists every one of those snapped to 700 or was synthesised.
 * A browser probe of /patro now reports 650, 850 and 900 resolving to Noto's
 * real axis.
 *
 * Mukta has no variable version (Google ships static 200-800), so its weights
 * stay enumerated -- and it is why `font-black` can never reach a true 900 in
 * the display face.
 *
 * Mukta's 500 is dropped deliberately. It was 80.7 KB of preload, 15% of the
 * total, for nothing: everything that asks for weight 500 (one `font-medium`
 * and two rules in 03-newsroom-account.css) inherits the body stack, which is
 * Source Sans 3 over Noto. A browser probe across /, /en, /patro and
 * /account/sign-in confirms weight 500 never resolves to Mukta on any of them,
 * and both of those families now cover 500 on their axis.
 */

export const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-mukta-face',
  preload: true,
})

export const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  display: 'swap',
  variable: '--font-devanagari-face',
  preload: true,
})

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-sans-face',
  preload: true,
})

export const fontVariables = `${mukta.variable} ${notoDevanagari.variable} ${sourceSans.variable}`
