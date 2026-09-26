#!/usr/bin/env node
/**
 * Hold the line on webfont weight, and on two mistakes that cost it.
 *
 * Every route used to preload 10 faces totalling 464,160 B — three times a
 * reasonable budget — and nothing in the build could tell. `audit:live-ux`
 * checks overflow, contrast, tiny text, letter-spacing and touch targets, but
 * not payload, so the largest reader-facing regression in the tree was the one
 * with no guard on it. Eight of those ten faces were Mukta: it has no variable
 * build, so next/font emits one file per weight per subset, and the display
 * face was preloading four weights across two subsets on top of Noto's body
 * face. See apps/web/app/fonts.ts for what changed and why.
 *
 * Three checks, because the byte total is a symptom and the other two are the
 * ways it comes back:
 *
 *   1. NESTED STACKS. `--font-mukta` already ends in Noto, the system fonts and
 *      a generic, so `font-family: var(--font-mukta), var(--font-devanagari),
 *      sans-serif` is not a longer fallback chain — it is a duplicated one.
 *      That pattern was in 65 CSS declarations and all three Tailwind
 *      fontFamily entries, and compiled `font-display` to a 15-entry stack
 *      naming Mukta three times and Noto four. Everything after the first
 *      occurrence of a family is unreachable by definition.
 *
 *   2. A DISPLAY WEIGHT THE FAMILY CANNOT SERVE. Mukta is static: the weight
 *      list in fonts.ts is exhaustive. Asking for less than its minimum snaps
 *      UP to the minimum, which silently emboldens a heading — this audit
 *      exists because a first pass at the font cut nearly dropped 600 and 700
 *      on the strength of a probe that had not visited the routes using them.
 *      Asking for more than the maximum is fine and deliberate: `font-black`
 *      (900) and the stylesheets' 850 select 800, measurably identically (at
 *      64px 'Nagarik Watch' advances 423px at 800, 850 and 900 alike), so they
 *      are an idiom for "as bold as this family goes", not a bug.
 *
 *   3. THE PRELOADED BYTE TOTAL, per route, from next/font's own manifest.
 *      Skipped with a notice when there is no build to read, so `verify:static`
 *      stays buildless; `verify:launch` builds first and gets the real number.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WEB = join(ROOT, 'apps', 'web')
const FONTS_TS = join(WEB, 'app', 'fonts.ts')
const TAILWIND = join(WEB, 'tailwind.config.ts')
const MANIFEST = join(WEB, '.next', 'server', 'next-font-manifest.json')

/** Worst-route preload budget. The measured total is 149,980 B across the two
 *  body faces; the headroom absorbs a subset change without hiding a regression
 *  like re-enabling the display face's preload, which would land near 464 KB. */
const BUDGET_BYTES = 160 * 1024

const STACK_TOKENS = ['--font-mukta', '--font-devanagari', '--font-source-sans']

/** Tailwind's font-weight utilities, for check 2. */
const WEIGHT_UTILITIES = {
  'font-thin': 100,
  'font-extralight': 200,
  'font-light': 300,
  'font-normal': 400,
  'font-medium': 500,
  'font-semibold': 600,
  'font-bold': 700,
  'font-extrabold': 800,
  'font-black': 900,
}

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, exts, out)
    else if (exts.some((e) => entry.endsWith(e))) out.push(full)
  }
  return out
}

const problems = []
const note = (file, line, message) => problems.push({ file, line, message })

/* ---------- 1. nested font stacks ---------- */

const styleFiles = [
  ...walk(join(WEB, 'app'), ['.css']),
  ...walk(join(ROOT, 'packages', 'ui', 'src'), ['.css']),
  TAILWIND,
]

let stacksScanned = 0
for (const file of styleFiles) {
  if (!existsSync(file)) continue
  const src = readFileSync(file, 'utf8')
  // Declarations may wrap, and a `font:` shorthand carries the family too, so
  // work on brace-free, comment-free declaration text rather than raw lines.
  const withoutComments = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  // A CSS declaration runs to the semicolon and may wrap; a Tailwind
  // fontFamily entry is an array literal and ends at its bracket. One regex for
  // both ran the three config entries together and reported a nest that was not
  // there, so each file kind gets the terminator it actually uses.
  const declaration = file.endsWith('.css')
    ? /(font-family|font)\s*:\s*([^;}]*)/g
    : /(devanagari|display|sans)\s*:\s*\[([^\]]*)\]/g
  for (let m = declaration.exec(withoutComments); m; m = declaration.exec(withoutComments)) {
    const value = m[2]
    const used = STACK_TOKENS.filter((t) => value.includes(`var(${t})`))
    if (used.length === 0) continue
    stacksScanned += 1
    if (used.length > 1) {
      const line = withoutComments.slice(0, m.index).split('\n').length
      note(
        file,
        line,
        `nests ${used.join(' + ')} in one declaration — each is already a complete stack, so only the first is reachable`,
      )
    }
  }
}

/* ---------- 2. display weights the family cannot serve ---------- */

const fontsSrc = readFileSync(FONTS_TS, 'utf8')
const muktaCall = /Mukta\(\{([\s\S]*?)\}\)/.exec(fontsSrc)
if (!muktaCall) throw new Error('could not locate the Mukta({ … }) call in apps/web/app/fonts.ts')
const weightList = /weight:\s*\[([^\]]*)\]/.exec(muktaCall[1])
if (!weightList) throw new Error('Mukta is static — it must declare an explicit weight list')
const shipped = [...weightList[1].matchAll(/\d+/g)].map((w) => Number(w[0])).sort((a, b) => a - b)
const minWeight = shipped[0]

// Tailwind: `font-display` and a weight utility in one className.
let weightSitesScanned = 0
for (const file of walk(join(WEB, 'app'), ['.tsx', '.ts']).concat(
  walk(join(WEB, 'components'), ['.tsx', '.ts']),
)) {
  const src = readFileSync(file, 'utf8')
  if (!src.includes('font-display')) continue
  const lines = src.split('\n')
  lines.forEach((text, index) => {
    if (!text.includes('font-display')) return
    for (const [utility, weight] of Object.entries(WEIGHT_UTILITIES)) {
      if (!new RegExp(`(^|[\\s"'\`])${utility}([\\s"'\`]|$)`).test(text)) continue
      weightSitesScanned += 1
      if (weight < minWeight) {
        note(
          file,
          index + 1,
          `font-display + ${utility} (${weight}) — the display family ships ${shipped.join('/')}, so this snaps UP to ${minWeight} and renders bolder than written`,
        )
      }
    }
  })
}

// CSS: a rule that sets the display family and a too-light weight.
for (const file of styleFiles) {
  if (!existsSync(file) || !file.endsWith('.css')) continue
  const src = readFileSync(file, 'utf8')
  for (const block of src.matchAll(/\{([^{}]*)\}/g)) {
    const body = block[1]
    if (!body.includes('var(--font-mukta)')) continue
    const weight = /font-weight:\s*(\d+)/.exec(body)
    if (!weight) continue
    weightSitesScanned += 1
    if (Number(weight[1]) < minWeight) {
      const line = src.slice(0, block.index).split('\n').length
      note(
        file,
        line,
        `sets the display family with font-weight: ${weight[1]} — it ships ${shipped.join('/')}, so this snaps UP to ${minWeight}`,
      )
    }
  }
}

/* ---------- 3. preloaded bytes per route ---------- */

let budgetLine = ''
if (!existsSync(MANIFEST)) {
  budgetLine =
    'Preload budget skipped: no build to measure (apps/web/.next). `pnpm verify:launch` builds first.'
} else {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const routes = Object.entries(manifest.app ?? {})
  let worst = { route: '(none)', bytes: 0, faces: 0 }
  for (const [route, files] of routes) {
    let bytes = 0
    for (const file of files) {
      const full = join(WEB, '.next', file)
      if (existsSync(full)) bytes += statSync(full).size
    }
    if (bytes > worst.bytes) worst = { route, bytes, faces: files.length }
  }
  if (worst.bytes > BUDGET_BYTES) {
    note(
      FONTS_TS,
      1,
      `preloads ${worst.bytes} B across ${worst.faces} faces on ${worst.route} — over the ${BUDGET_BYTES} B budget by ${worst.bytes - BUDGET_BYTES} B`,
    )
  }
  budgetLine = `worst route preloads ${worst.faces} face(s), ${worst.bytes} B of ${BUDGET_BYTES} B budget`
  if (manifest.appUsingSizeAdjust !== true) {
    note(
      FONTS_TS,
      1,
      'size-adjusted fallbacks are off — a non-preloaded face then swaps with a layout shift',
    )
  }
}

/* ---------- report ---------- */

if (problems.length > 0) {
  for (const { file, line, message } of problems) {
    console.log(`  ${relative(ROOT, file)}:${line}  ${message}`)
  }
  console.error(`\nFont-budget audit failed: ${problems.length} problem(s).`)
  console.error('See apps/web/app/fonts.ts for what the weight list and preload flag are doing.')
  process.exit(1)
}

console.log(
  `Font-budget audit passed (${stacksScanned} font stacks, ${weightSitesScanned} display-weight sites against Mukta ${shipped.join('/')}; ${budgetLine}).`,
)
