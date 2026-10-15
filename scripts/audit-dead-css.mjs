#!/usr/bin/env node
/**
 * Dead CSS audit.
 *
 * `apps/web/app/styles/*.css` is the hand-written stylesheet, split by surface,
 * and `globals.css` says plainly that its import order is the cascade. What it
 * could not say is which of its rules still match anything. Routes get rewritten
 * in Tailwind utilities and the old block stays: `/rashifal` was rebuilt as
 * utility classes and left 55 lines of `.rashifal-grid*` behind, 20 lines of
 * `.utility-result` outlived the calculator that used it, and both were still
 * being read, formatted and shipped — one of them was even "fixed" during a type
 * audit, adjusting a size no reader has ever seen.
 *
 * So: every class selector in those stylesheets must be reachable from source.
 *
 * ## What counts as reachable
 *
 * A class is reachable if it appears as a whole token in the TypeScript, TSX or
 * MDX of `apps/*` and `packages/*`. Whole token, not substring: the first
 * version of this check matched substrings and reported `.score-section` as
 * reachable because `sports-score-section` contains those characters — two
 * unrelated classes, and `class="sports-score-section"` does not match
 * `.score-section`. Tokenising the source the same way a class name is spelled
 * (`[A-Za-z_][A-Za-z0-9_-]*`) makes the comparison exact, and a Tailwind
 * arbitrary value like `text-[0.7rem]` breaks the token at the bracket, which is
 * also correct.
 *
 * Classes are also composed at runtime — `cn('admin-status', `admin-status--${tone}`)`
 * — and the suffix never appears as a standalone string. Those prefixes are
 * discovered from the source rather than allowlisted by hand, so a new dynamic
 * family does not need this file edited: any `foo--${` or `foo__${` in a
 * template literal marks every class starting with `foo--` / `foo__` reachable.
 * A class assembled by concatenating string literals (`'utility-' + 'tool'`)
 * would defeat both, which is one more reason not to write classes that way.
 *
 * Usage:
 *   node scripts/audit-dead-css.mjs            # report and fail on dead rules
 *   node scripts/audit-dead-css.mjs --self-test
 */
import { readdirSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const STYLE_DIR = join(ROOT, 'apps', 'web', 'app', 'styles')
const SOURCE_ROOTS = [join(ROOT, 'apps'), join(ROOT, 'packages')]
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', '.turbo', 'coverage'])
const SOURCE_EXT = /\.(tsx?|jsx?|mdx?|html)$/

/**
 * Classes that exist for a consumer this gate cannot see. Keep this empty if at
 * all possible; an entry here is a rule nothing in the repo can be shown to use.
 */
const ALLOWLIST = new Set()

function walk(dir, keep, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, keep, out)
    else if (entry.isFile() && keep(entry.name)) out.push(full)
  }
  return out
}

/** Every class selector in `styleDir`, mapped to the files that declare it. */
export function collectClassSelectors(styleDir) {
  const selectors = new Map()
  for (const name of readdirSync(styleDir)
    .filter((f) => f.endsWith('.css'))
    .sort()) {
    const source = readFileSync(join(styleDir, name), 'utf8')
    for (const [, cls] of source.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) {
      if (!selectors.has(cls)) selectors.set(cls, new Set())
      selectors.get(cls).add(name)
    }
  }
  return selectors
}

/**
 * The source text every class is looked for in, plus the prefixes of classes
 * assembled at runtime.
 */
export function collectSourceIndex(roots) {
  const tokens = new Set()
  const dynamicPrefixes = new Set()
  for (const root of roots) {
    for (const file of walk(root, (name) => SOURCE_EXT.test(name))) {
      const source = readFileSync(file, 'utf8')
      for (const [token] of source.matchAll(/[A-Za-z_][A-Za-z0-9_-]*/g)) tokens.add(token)
      for (const [, prefix] of source.matchAll(/([A-Za-z][A-Za-z0-9-]*(?:__|--))\$\{/g)) {
        dynamicPrefixes.add(prefix)
      }
    }
  }
  return { tokens, dynamicPrefixes }
}

export function findDeadClasses(selectors, { tokens, dynamicPrefixes }, allowlist = ALLOWLIST) {
  const dead = []
  for (const [cls, files] of selectors) {
    if (allowlist.has(cls)) continue
    if (tokens.has(cls)) continue
    let dynamic = false
    for (const prefix of dynamicPrefixes) {
      if (cls.startsWith(prefix)) {
        dynamic = true
        break
      }
    }
    if (dynamic) continue
    dead.push({ cls, files: [...files].sort() })
  }
  dead.sort((a, b) => a.files.join().localeCompare(b.files.join()) || a.cls.localeCompare(b.cls))
  return dead
}

function runSelfTest() {
  const work = mkdtempSync(join(tmpdir(), 'dead-css-'))
  const failures = []
  const expect = (condition, message) => {
    if (!condition) failures.push(message)
  }
  try {
    const styles = join(work, 'styles')
    const src = join(work, 'src')
    mkdirSync(styles, { recursive: true })
    mkdirSync(src, { recursive: true })
    writeFileSync(
      join(styles, '01-a.css'),
      '.kept { color: red }\n.gone { color: blue }\n.tone--warn { color: gold }\n' +
        '.kept:hover > .kept__child { color: pink }\n',
    )
    writeFileSync(
      join(src, 'Thing.tsx'),
      'export const T = () => <b className={`kept kept__child tone--${tone}`} />\n',
    )

    const selectors = collectClassSelectors(styles)
    expect(selectors.size === 4, `expected 4 selectors, saw ${selectors.size}`)
    expect(selectors.has('kept__child'), 'BEM children must be collected')

    const index = collectSourceIndex([src])
    expect(index.dynamicPrefixes.has('tone--'), 'dynamic prefixes must be discovered from source')
    expect(index.tokens.has('kept__child'), 'source tokens must keep BEM names whole')

    // A class that is only a hyphen-separated tail of a source token is not
    // reachable: class="a-kept" does not match .kept.
    writeFileSync(join(styles, '02-tail.css'), '.ept { color: teal }\n')
    const tailSelectors = collectClassSelectors(styles)
    const tail = findDeadClasses(tailSelectors, collectSourceIndex([src]))
    expect(
      tail.some((d) => d.cls === 'ept'),
      'a substring of a source token must not count as reachable',
    )
    rmSync(join(styles, '02-tail.css'))

    const dead = findDeadClasses(selectors, index)
    expect(
      dead.length === 1,
      `expected 1 dead class, saw ${dead.length}: ${dead.map((d) => d.cls)}`,
    )
    expect(dead[0]?.cls === 'gone', 'the unreferenced class must be the one reported')

    // An allowlisted class is not reported even when nothing references it.
    const allowed = findDeadClasses(selectors, index, new Set(['gone']))
    expect(allowed.length === 0, 'the allowlist must suppress a class')

    // With no dynamic prefix in source, the runtime-composed class is dead.
    writeFileSync(
      join(src, 'Thing.tsx'),
      'export const T = () => <b className="kept kept__child" />\n',
    )
    const noDynamic = findDeadClasses(selectors, collectSourceIndex([src]))
    expect(
      noDynamic.some((d) => d.cls === 'tone--warn'),
      'without a dynamic prefix the composed class must be reported',
    )
  } finally {
    rmSync(work, { recursive: true, force: true })
  }

  if (failures.length) {
    console.error('audit:dead-css self-test FAILED:')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }
  console.log('audit:dead-css self-test passed.')
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest()
    return
  }

  const selectors = collectClassSelectors(STYLE_DIR)
  const index = collectSourceIndex(SOURCE_ROOTS)
  const dead = findDeadClasses(selectors, index)

  const where = relative(ROOT, STYLE_DIR)
  if (!dead.length) {
    console.log(
      `Dead CSS audit: ${selectors.size} class selector(s) in ${where}, all reachable from source.`,
    )
    return
  }

  console.error(`Dead CSS audit FAILED: ${dead.length} class selector(s) nothing can match.\n`)
  const byFile = new Map()
  for (const { cls, files } of dead) {
    const key = files.join(', ')
    if (!byFile.has(key)) byFile.set(key, [])
    byFile.get(key).push(cls)
  }
  for (const [file, classes] of byFile) {
    console.error(`${file}  (${classes.length})`)
    for (const cls of classes) console.error(`  .${cls}`)
  }
  console.error(
    '\nDelete the rule, or wire the class up. If it is for a consumer outside this repo,' +
      '\nadd it to ALLOWLIST in scripts/audit-dead-css.mjs with a comment saying who uses it.',
  )
  process.exit(1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
