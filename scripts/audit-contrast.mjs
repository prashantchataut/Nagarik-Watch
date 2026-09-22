#!/usr/bin/env node
/**
 * WCAG 2.2 contrast gate for the Civic Crimson palette.
 *
 * The roadmap carried "colour contrast is unverified" as an open item, and
 * `packages/ui/src/tokens.css` claimed "High-contrast WCAG AAA/AA compliant
 * across all themes" in a comment. A comment is not a measurement. This reads
 * the tokens out of that file — both themes — resolves them to sRGB, and
 * checks every pair that actually renders as text or as a meaningful
 * non-text mark.
 *
 * Two things make this site's case stricter than the usual one:
 *   - it is Devanagari-first, and matras are thin strokes. A ratio that reads
 *     fine for Latin body text is harder work here, so body text is held to
 *     4.5:1 with no "large text" exemption below 24px.
 *   - the tokens are authored in oklch, which is perceptually uniform and
 *     therefore very easy to *nudge* without noticing it crossed a line.
 *
 * Zero dependencies on purpose: this runs in `pnpm verify:static`, which has
 * to work before install in a clean checkout.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const TOKENS = join(here, '..', 'packages', 'ui', 'src', 'tokens.css')

/* ---------- colour conversion ---------- */

function srgbFromLinear(value) {
  const v = Math.max(0, Math.min(1, value))
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
}

/** oklch → sRGB in 0..1. The matrices are the published OKLab ones. */
function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  return [
    srgbFromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    srgbFromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    srgbFromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

function toHex(rgb) {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.max(0, Math.min(1, channel)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/**
 * Composite a possibly-translucent colour over a backdrop. Contrast applies to
 * what is rendered, and a scrim at 45% is not its own colour.
 */
function composite(fg, alpha, bg) {
  return fg.map((channel, i) => channel * alpha + bg[i] * (1 - alpha))
}

function parseColor(raw, resolve) {
  const value = raw.trim()

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (hex) {
    let h = hex[1].toLowerCase()
    if (h.length === 3) h = [...h].map((c) => c + c).join('')
    return {
      rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255),
      alpha: 1,
    }
  }

  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/i.exec(value)
  if (oklch) {
    return {
      rgb: oklchToRgb(Number(oklch[1]), Number(oklch[2]), Number(oklch[3])),
      alpha: oklch[4] === undefined ? 1 : Number(oklch[4]),
    }
  }

  const ref = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(value)
  if (ref) return resolve(ref[1])

  if (value === 'white') return { rgb: [1, 1, 1], alpha: 1 }
  if (value === 'black') return { rgb: [0, 0, 0], alpha: 1 }
  return null
}

/* ---------- token extraction ---------- */

/**
 * Tokens are declared three times over (`:root`, the `prefers-color-scheme`
 * block, and the two `[data-theme]` selectors). The explicit `[data-theme]`
 * blocks are the authority — they are what the theme toggle sets — so each
 * theme is read from its own block, falling back to `:root` for the tokens
 * that never vary.
 */
function readThemes(css) {
  const base = {}
  const themes = { light: {}, dark: {} }
  /** The `prefers-color-scheme: dark` copy, kept apart so it can be diffed. */
  const mediaDark = {}

  // The `:root` inside `@media (prefers-color-scheme: dark)` is a plain `:root`
  // selector — nothing in the rule itself says which one it is. So find the
  // media block's span by brace-matching first, and classify by position.
  const darkSpan = (() => {
    const at = css.search(/@media[^{]*prefers-color-scheme:\s*dark[^{]*\{/)
    if (at < 0) return null
    let depth = 0
    for (let i = css.indexOf('{', at); i < css.length; i += 1) {
      if (css[i] === '{') depth += 1
      else if (css[i] === '}' && (depth -= 1) === 0) return [at, i]
    }
    return null
  })()

  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  for (const block of blocks) {
    const body = block[2]
    const declarations = [...body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)]
    if (declarations.length === 0) continue

    const selector = block[1].trim().split('\n').pop().trim()
    const inDarkMedia = darkSpan !== null && block.index > darkSpan[0] && block.index < darkSpan[1]

    let target = null
    if (selector === ':root') target = inDarkMedia ? mediaDark : base
    else if (selector === ":root[data-theme='light']") target = themes.light
    else if (selector === ":root[data-theme='dark']") target = themes.dark
    if (!target) continue

    for (const [, name, value] of declarations) target[name] = value.trim()
  }

  for (const theme of Object.values(themes)) {
    for (const [name, value] of Object.entries(base)) {
      if (!(name in theme)) theme[name] = value
    }
  }
  return { themes, base, mediaDark }
}

/**
 * Every token is written out four times: `:root` (light default), the
 * `prefers-color-scheme: dark` copy, and the two `[data-theme]` blocks that
 * the theme toggle switches between. That duplication is unavoidable in plain
 * CSS — `light-dark()` would collapse it, but a browser that does not know the
 * function drops the declaration entirely and the site renders unstyled, which
 * is not a trade worth making for an audience on older Android WebViews.
 *
 * What is avoidable is the duplication silently drifting: a colour fixed in
 * one block and not the other passes the audit while half the readers still
 * see the old value. So the copies are diffed.
 */
function driftReport(base, mediaDark, themes) {
  const problems = []
  const compare = (aName, a, bName, b) => {
    for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
      // `:root` also holds spacing, radii and fonts, which the theme blocks
      // do not restate. Only tokens present in both are meant to match.
      if (!(name in a) || !(name in b)) {
        if (
          name in a &&
          /color|brand|ink|surface|chrome|rule|accent|aqi|paper|link|up|down|breaking|focus|scrim|shadow|mute|on-/.test(
            name,
          )
        )
          problems.push(`${name}: declared in ${aName} but missing from ${bName}`)
        continue
      }
      if (a[name] !== b[name])
        problems.push(`${name}: ${aName} has "${a[name]}", ${bName} has "${b[name]}"`)
    }
  }
  compare(':root (light)', base, "[data-theme='light']", themes.light)
  compare('@media dark', mediaDark, "[data-theme='dark']", themes.dark)
  return problems
}

function resolverFor(tokens) {
  const seen = new Set()
  const resolve = (name) => {
    if (seen.has(name)) return null
    seen.add(name)
    const raw = tokens[name]
    const out = raw === undefined ? null : parseColor(raw, resolve)
    seen.delete(name)
    return out
  }
  return resolve
}

/* ---------- WCAG maths ---------- */

function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/* ---------- the pairs that matter ---------- */

const TEXT = 4.5
const LARGE = 3
const NON_TEXT = 3

/**
 * Every pair below corresponds to something a reader actually sees. `min` is
 * the WCAG threshold for that role; `note` says where it renders, so a
 * failure names a surface instead of a hex code.
 */
const PAIRS = [
  // Body and chrome text
  ['--ink', '--surface', TEXT, 'body text on the page wash'],
  ['--ink', '--surface-raised', TEXT, 'body text on a raised card'],
  ['--ink-soft', '--surface', TEXT, 'secondary text on the page wash'],
  ['--ink-soft', '--surface-raised', TEXT, 'secondary text on a card'],
  ['--mute', '--surface', TEXT, 'captions and metadata on the page wash'],
  ['--mute', '--surface-raised', TEXT, 'captions and metadata on a card'],
  ['--on-chrome', '--chrome', TEXT, 'masthead text'],
  ['--on-chrome-soft', '--chrome', TEXT, 'masthead secondary text'],

  // Brand as text — the split-role question: a fill colour is not a text colour
  ['--link', '--surface', TEXT, 'inline links in prose'],
  ['--link', '--surface-raised', TEXT, 'links on a card'],
  ['--brand-strong', '--surface', TEXT, 'category labels and section kickers'],
  ['--brand-strong', '--brand-tint', TEXT, 'text inside a brand-tinted callout'],
  ['--breaking', '--surface', TEXT, 'breaking-news label'],
  ['--breaking', '--surface-raised', TEXT, 'breaking-news label on a card'],

  // Reversed-out text on fills. The desk bar is dark crimson in both themes, so
  // --paper is right there. --brand is *not* one colour: it is a mid crimson in
  // light and a bright coral in dark, so the text that sits on it has to flip.
  // That is what --on-brand is for; --paper on a dark-theme brand fill is 2.4:1.
  ['--paper', '--brand-bar', TEXT, 'nav text on the crimson desk bar'],
  ['--paper', '--brand-bar-active', TEXT, 'active nav item on the desk bar'],
  ['--on-brand', '--brand', TEXT, 'text on a filled primary button'],
  ['--on-brand', '--brand-strong', TEXT, 'text on a primary button, hover'],
  ['--on-brand', '--breaking', TEXT, 'text on a filled danger/breaking button'],

  // Market and air-quality readouts: colour carries meaning, so they are text
  ['--up', '--surface', TEXT, 'NEPSE gainers'],
  ['--down', '--surface', TEXT, 'NEPSE losers'],
  ['--aqi-good', '--surface', LARGE, 'AQI good reading (large numeral)'],
  ['--aqi-moderate', '--surface', LARGE, 'AQI moderate reading (large numeral)'],
  ['--aqi-unhealthy', '--surface', LARGE, 'AQI unhealthy reading (large numeral)'],
  ['--aqi-severe', '--surface', LARGE, 'AQI severe reading (large numeral)'],

  // Non-text: SC 1.4.11 covers focus rings, borders and separators that carry meaning
  ['--focus-ring', '--surface', NON_TEXT, 'focus ring against the page wash'],
  ['--focus-ring', '--surface-raised', NON_TEXT, 'focus ring against a card'],
  ['--focus-ring', '--chrome', NON_TEXT, 'focus ring in the masthead'],
  ['--rule-strong', '--surface', NON_TEXT, 'input borders and strong separators'],
  ['--rule-strong', '--surface-raised', NON_TEXT, 'input borders on a card'],
  // --accent-gold is a fill, and a badge's fill against the page is decorative:
  // what has to be legible is the label inside it, which is the pair below.
  // Holding the fill itself to 3:1 would force a muddy gold for no reader gain.
  ['--on-accent', '--accent-gold', TEXT, 'text on a gold badge'],
  ['--ink', '--accent-gold-bg', TEXT, 'text on the soft gold tint'],
]

/* ---------- run ---------- */

const css = readFileSync(TOKENS, 'utf8')
const { themes, base, mediaDark } = readThemes(css)

let failures = 0
let checked = 0
const lines = []

const drift = driftReport(base, mediaDark, themes)
for (const problem of drift) lines.push(`  DRIFT ${problem}`)
failures += drift.length

for (const [themeName, tokens] of Object.entries(themes)) {
  const resolve = resolverFor(tokens)
  const backdrop = parseColor(tokens['--surface'], resolve)

  for (const [fgName, bgName, min, note] of PAIRS) {
    const fg = resolve(fgName)
    const bg = resolve(bgName)
    if (!fg || !bg) {
      lines.push(`  ?  ${themeName}  ${fgName} on ${bgName} — token missing or unparsed`)
      failures += 1
      continue
    }
    const fgRgb = fg.alpha === 1 ? fg.rgb : composite(fg.rgb, fg.alpha, bg.rgb)
    const bgRgb = bg.alpha === 1 ? bg.rgb : composite(bg.rgb, bg.alpha, backdrop.rgb)
    const value = ratio(fgRgb, bgRgb)
    checked += 1
    const ok = value >= min
    if (!ok) failures += 1
    if (!ok || process.env.CONTRAST_VERBOSE === '1') {
      lines.push(
        `  ${ok ? 'ok' : 'FAIL'}  ${themeName.padEnd(5)} ${value.toFixed(2)}:1 (need ${min})  ` +
          `${fgName} ${toHex(fgRgb)} on ${bgName} ${toHex(bgRgb)} — ${note}`,
      )
    }
  }
}

if (lines.length > 0) console.log(lines.join('\n'))

if (failures > 0) {
  const belowThreshold = failures - drift.length
  console.error(
    `\nContrast audit failed: ${belowThreshold} of ${checked} pairs below their WCAG 2.2 AA` +
      `${drift.length ? `, plus ${drift.length} theme-block drift(s)` : ''}.`,
  )
  console.error('Fix the token in packages/ui/src/tokens.css — not the component that uses it.')
  process.exit(1)
}

console.log(
  `Contrast audit passed (${checked} token pairs across light and dark at WCAG 2.2 AA, ` +
    'theme blocks in sync).',
)
