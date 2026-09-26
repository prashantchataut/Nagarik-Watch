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
 * Mukta keeps all three of its remaining weights and gives up its preload
 * instead. That trade is the largest reader-facing win available here, and it is
 * worth spelling out, because the obvious move -- cutting weights -- is wrong.
 *
 * What was measured. Every page preloaded 10 faces totalling 464,160 B, and 8 of
 * the 10 were Mukta: four weights across two subsets. Mukta is static, so
 * next/font emits one file per weight per subset, where Noto and Source Sans
 * each emit a single axis-spanning file. Two complete Devanagari families were
 * preloaded on every route: Mukta's 197 KB of display weights on top of Noto's
 * 121 KB of body.
 *
 * Why the weights stay. Weight 400 is genuinely dead -- no element on any probed
 * route resolves Mukta at 400 -- so it is gone. 600 and 700 are not:
 * `font-display font-semibold` and `font-display font-bold` appear across the
 * epaper, disaster-alert, cookies, columns, newsletter and fact-check pages, the
 * home-page poll and today-in-history rails, and most admin desks. A first pass
 * here concluded from a 12-route probe that 600 and 700 were nearly unused and
 * could be dropped; that probe had simply not visited those routes. Dropping
 * them would have quietly emboldened several dozen headings with no test to
 * catch it, which is why the guard below checks this and not just this comment.
 *
 * Why the preload goes instead. First paint is body copy, and the body stack is
 * Source Sans 3 over Noto -- both still preloaded. Mukta sets headings, which are
 * large, few, and the best candidates on the page for `display: swap`. It also
 * degrades honestly: `--font-mukta` falls back to Noto Sans Devanagari, which IS
 * preloaded, so a Devanagari heading swaps from one real Devanagari face to
 * another rather than from a system serif, and next/font's metric-matched
 * `Mukta Fallback` keeps that swap from shifting layout.
 *
 * Result: 2 preloaded faces, 149,980 B, from 10 faces and 464,160 B. Mukta still
 * loads on every page; it is discovered through the stylesheet instead of
 * blocking ahead of the text. `scripts/audit-font-budget.mjs` fails the build if
 * the preloaded total climbs back over its budget, if a stylesheet asks the
 * display face for a weight this list does not ship, or if two font stacks are
 * nested in one declaration.
 *
 * Weights above 800 are a deliberate non-issue. `font-black` (900) and the
 * stylesheets' 850 cannot exist in a static family, so they select 800. Measured
 * at 64px, 'Nagarik Watch' advances 423px at 800, 423px at 850 and 423px at 900
 * -- identical, so the browser snaps to 800 rather than synthesising a fake
 * weight. Nothing renders wrongly; the declarations just aim higher than the
 * family reaches. Hence the audit treats a request ABOVE the shipped maximum as
 * fine and one BELOW the shipped minimum as a failure.
 *
 * Mukta's 500 was dropped earlier for the same reason as 400: 80.7 KB of preload
 * for nothing, since everything asking for weight 500 inherits the body stack
 * (Source Sans 3 over Noto), and both of those cover 500 on an axis.
 */

export const mukta = Mukta({
  subsets: ['devanagari', 'latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-mukta-face',
  preload: false,
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
