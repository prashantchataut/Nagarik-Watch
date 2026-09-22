#!/usr/bin/env node
/**
 * Catch design-system utilities that do not exist.
 *
 * Tailwind fails silently: `text-body-sm` when the scale only defines `body`
 * and `body-lg` is not an error, it is simply no CSS. The element inherits its
 * size and nobody notices until a reader sees a paragraph in the wrong type.
 * The same goes for `bg-brand-subtle`, `text-ink-muted`, `border-rule-strong`
 * — each is a plausible-looking name for a token that was never defined.
 *
 * Three of these were live in the tree when this script was written
 * (`text-body-sm`, in the live-data components), which is why it exists.
 *
 * Scope is deliberately narrow to stay free of false positives: only utilities
 * whose value begins with one of *this project's* token families are checked.
 * Tailwind's own scale (text-sm, bg-white, border-2, …) is none of our
 * business, and a family we do not own is skipped rather than guessed at.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WEB = join(ROOT, 'apps', 'web')
const SCAN = [
  join(WEB, 'app'),
  join(WEB, 'components'),
  join(WEB, 'lib'),
  join(ROOT, 'packages', 'ui', 'src'),
]

/* ---------- what the design system actually defines ---------- */

/**
 * Body of the `<key>: { … }` object literal starting at `key`, found by
 * brace-matching rather than by an indentation-anchored regex: the config files
 * are prettier-formatted, and a reindent must not silently turn this audit into
 * a no-op that reports "0 tokens" and passes everything.
 */
function objectBody(src, key, where) {
  const at = new RegExp(`${key}:\\s*\\{`).exec(src)
  if (!at) throw new Error(`could not locate the ${key} block in ${where}`)
  const open = src.indexOf('{', at.index)
  let depth = 0
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}' && (depth -= 1) === 0) return src.slice(open + 1, i)
  }
  throw new Error(`unbalanced braces in the ${key} block in ${where}`)
}

/** Colour keys from the preset, flattened the way Tailwind flattens them. */
function readColorKeys() {
  const src = readFileSync(join(ROOT, 'packages', 'ui', 'src', 'tailwind-preset.ts'), 'utf8')
  const body = objectBody(src, 'colors', 'tailwind-preset.ts')

  const keys = new Set()
  let group = null
  for (const line of body.split('\n')) {
    const text = line.replace(/\/\/.*$/, '').trim()
    if (!text) continue
    const open = /^'?([a-z0-9-]+)'?:\s*\{$/.exec(text)
    if (open) {
      group = open[1]
      continue
    }
    if (text.startsWith('}')) {
      group = null
      continue
    }
    const entry = /^'?([A-Za-z0-9-]+)'?:\s*'/.exec(text)
    if (!entry) continue
    if (group === null) keys.add(entry[1])
    else if (entry[1] === 'DEFAULT') keys.add(group)
    else keys.add(`${group}-${entry[1]}`)
  }
  return keys
}

/** fontSize keys from the app's tailwind config. */
function readFontSizeKeys() {
  const src = readFileSync(join(WEB, 'tailwind.config.ts'), 'utf8')
  const body = objectBody(src, 'fontSize', 'tailwind.config.ts')
  const keys = new Set()
  for (const m of body.matchAll(/^\s*'?([A-Za-z0-9-]+)'?:\s*\[/gm)) keys.add(m[1])
  return keys
}

const colors = readColorKeys()
const fontSizes = readFontSizeKeys()

/**
 * A utility is ours to check when its value starts with a segment we own.
 * `text-body-sm` → family `body` (a fontSize we define) → must be an exact key.
 * `text-sm`      → family `sm`   (not ours) → skipped.
 */
function families(keys) {
  const out = new Set()
  for (const key of keys) out.add(key.split('-')[0])
  return out
}
const colorFamilies = families(colors)
const fontFamilies = families(fontSizes)
// `on-brand` / `on-chrome` / `aqi-good` have a shared first segment, so the
// family for those is the two-segment prefix, not the first word alone.
for (const key of colors) {
  if (key.startsWith('on-') || key.startsWith('aqi-')) {
    colorFamilies.delete(key.split('-')[0])
    colorFamilies.add(key.split('-').slice(0, 2).join('-'))
  }
}

const COLOR_PREFIXES = [
  'text',
  'bg',
  'border',
  'fill',
  'stroke',
  'ring',
  'outline',
  'decoration',
  'divide',
  'from',
  'to',
  'via',
  'shadow',
  'accent',
  'caret',
  'placeholder',
]

/**
 * Comments are not markup. A note explaining that `text-display-sm` was wrong
 * must not itself be reported as `text-display-sm` being wrong, so block and
 * line comments are blanked (kept as newlines, to preserve line numbers).
 * `//` inside a URL is left alone.
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:\w])\/\/[^\n]*/g, (_, lead) => lead)
}

/** Strip a variant chain (`hover:`, `sm:`, `group-focus:`) and any `/50` alpha. */
function bare(token) {
  const withoutVariants = token.slice(token.lastIndexOf(':') + 1)
  const withoutAlpha = withoutVariants.split('/')[0]
  return withoutAlpha.replace(/^[!-]+/, '')
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (entry === 'node_modules' || entry === '.next') continue
    if (statSync(path).isDirectory()) yield* walk(path)
    else if (/\.tsx?$/.test(path)) yield path
  }
}

const problems = []
let scanned = 0

for (const dir of SCAN) {
  for (const file of walk(dir)) {
    const src = stripComments(readFileSync(file, 'utf8'))
    scanned += 1
    const lines = src.split('\n')
    lines.forEach((line, index) => {
      for (const raw of line.split(/[\s'"`{}()<>,]+/)) {
        const token = bare(raw)
        const dash = token.indexOf('-')
        if (dash < 0) continue
        const prefix = token.slice(0, dash)
        const value = token.slice(dash + 1)
        if (!COLOR_PREFIXES.includes(prefix)) continue
        if (!/^[a-z0-9-]+$/.test(value)) continue

        const twoSegment = value.split('-').slice(0, 2).join('-')
        const one = value.split('-')[0]

        if (prefix === 'text' && (fontFamilies.has(one) || fontSizes.has(value))) {
          // `text-*` is overloaded: it sets colour *and* size. Accept either.
          if (fontSizes.has(value) || colors.has(value)) continue
          problems.push({ file, line: index + 1, token, kind: 'font size' })
          continue
        }
        if (colorFamilies.has(twoSegment) || colorFamilies.has(one)) {
          if (colors.has(value)) continue
          problems.push({ file, line: index + 1, token, kind: 'colour' })
        }
      }
    })
  }
}

if (problems.length > 0) {
  const seen = new Set()
  for (const { file, line, token, kind } of problems) {
    const key = `${file}:${line}:${token}`
    if (seen.has(key)) continue
    seen.add(key)
    console.log(
      `  ${relative(ROOT, file)}:${line}  ${token} — no such ${kind} in the design system`,
    )
  }
  console.error(
    `\nDesign-token audit failed: ${seen.size} utilit${seen.size === 1 ? 'y references' : 'ies reference'} a token that does not exist.`,
  )
  console.error('Tailwind emits nothing for these, so the element silently falls back.')
  console.error(
    'Either define the token (packages/ui/src/tailwind-preset.ts, apps/web/tailwind.config.ts)',
  )
  console.error('or use one that exists.')
  process.exit(1)
}

console.log(
  `Design-token audit passed (${scanned} files; ${colors.size} colour and ${fontSizes.size} type tokens).`,
)
