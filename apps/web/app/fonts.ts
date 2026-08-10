/**
 * Font definitions for Nagarik Watch.
 *  - Mukta: Devanagari + Latin display (headlines) — news masthead voice.
 *  - Noto Sans Devanagari: Devanagari body (best Nepali matra/conjunct coverage).
 *  - Source Sans 3: Latin UI / English body (editorial companion).
 *
 * Exposes CSS variable classes for seamless offline builds and CDN-backed font stacks.
 */

export const mukta = {
  variable: '--font-mukta',
  className: 'font-display',
}

export const notoDevanagari = {
  variable: '--font-devanagari',
  className: 'font-devanagari',
}

export const sourceSans = {
  variable: '--font-source-sans',
  className: 'font-sans',
}

/** All font className variables, applied on <html> in the root layout. */
export const fontVariables = ''
