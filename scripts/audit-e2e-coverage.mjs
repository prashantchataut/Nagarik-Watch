#!/usr/bin/env node
/**
 * E2E runner-coverage audit.
 *
 * Every spec in `e2e/` runs under exactly one Playwright config. The reader
 * suite (`playwright.config.ts`) takes the whole directory and subtracts the
 * specs that need staff auth; the newsroom and admin suites each claim one
 * spec by `testMatch`. Nothing checked that the two halves agreed.
 *
 * They stopped agreeing. `admin-desk.spec.ts` was added with its own runner —
 * `playwright.admin.config.ts`, which boots PGlite auth and seeds the staff
 * accounts it signs in as — but the reader config's exclusions lived as a
 * duplicated literal in each project block, and only one of them was ever
 * updated. So the reader suite also picked the spec up and ran it against a
 * server that refuses a pool on purpose: 33 desk routes × 2 projects, every
 * one failing `503 AUTH_UNAVAILABLE` at sign-in, on a spec whose subject was
 * entirely healthy. CI on `main` was red for two days for that reason.
 *
 * The failure is cheap to prevent and expensive to read, so this asserts the
 * invariant directly:
 *
 *   - every spec is claimed by at least one config, and
 *   - a spec claimed by a dedicated runner is excluded from the reader suite.
 *
 * Configs are parsed as text rather than imported. Importing them would need a
 * TypeScript loader and would execute `webServer` config for its side effects;
 * the patterns are literals in the source and reading them is enough.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The reader suite: takes `e2e/` wholesale and subtracts. */
const READER_CONFIG = 'playwright.config.ts'

/** Suites that claim a single spec with `testMatch`. */
const DEDICATED_CONFIGS = ['playwright.newsroom.config.ts', 'playwright.admin.config.ts']

const problems = []

/** `/foo\.spec\.ts/` regex literals in a fragment, as bare filenames. */
function literalSpecs(fragment) {
  const names = new Set()
  for (const [, name] of fragment.matchAll(/\/([\w-]+)\\\.spec\\\.ts\//g)) {
    names.add(`${name}.spec.ts`)
  }
  return names
}

/**
 * Spec names an ignore/match list resolves to, following one level of spread.
 *
 * The reader config shares its staff-auth exclusions through a module-level
 * `const`, so `testIgnore: [/mobile\.spec\.ts/, ...AUTHENTICATED_SPECS]` has to
 * resolve to the constant's contents. Without this the audit reads the list as
 * empty and reports the outage it is meant to prevent on a config that is
 * actually correct — a false alarm that would get the audit deleted.
 */
function resolveList(fragment, source) {
  const names = literalSpecs(fragment)
  for (const [, ident] of fragment.matchAll(/\.\.\.([A-Za-z_$][\w$]*)/g)) {
    const declared = source.match(new RegExp(`const\\s+${ident}\\s*=\\s*(\\[[^\\]]*\\])`))
    if (!declared) {
      problems.push(
        `${READER_CONFIG} spreads ...${ident} into a spec list, but no ` +
          `\`const ${ident} = [...]\` is declared in the same file, so this audit ` +
          `cannot tell which specs it excludes.`,
      )
      continue
    }
    for (const name of literalSpecs(declared[1])) names.add(name)
  }
  return names
}

/** Every spec named by `key` in a config, across all of its occurrences. */
function specPatterns(source, key, scope = source) {
  const names = new Set()
  // Matches `testMatch: /x\.spec\.ts/` and every entry of a `testIgnore: [...]`
  // array, including one spread across lines.
  for (const [, body] of scope.matchAll(new RegExp(`${key}:\\s*(\\[[^\\]]*\\]|/[^/\\n]+/)`, 'g'))) {
    for (const name of resolveList(body, source)) names.add(name)
  }
  return names
}

const specs = readdirSync(resolve(root, 'e2e'))
  .filter((name) => name.endsWith('.spec.ts'))
  .sort()

if (specs.length === 0) problems.push('e2e/ contains no spec files at all')

const readerSource = readFileSync(resolve(root, READER_CONFIG), 'utf8')
const readerIgnores = specPatterns(readerSource, 'testIgnore')

// The reader config's project blocks each carry their own ignore list. A spec
// excluded from only some of them still runs in the others, which is the exact
// shape of the outage above, so require the exclusion to be unanimous.
const projectIgnoreLists = [...readerSource.matchAll(/testIgnore:\s*\[[^\]]*\]/g)].map((m) =>
  specPatterns(readerSource, 'testIgnore', m[0]),
)
const readerMatchOnly = specPatterns(readerSource, 'testMatch')

const claimed = new Map()
for (const config of DEDICATED_CONFIGS) {
  for (const spec of specPatterns(readFileSync(resolve(root, config), 'utf8'), 'testMatch')) {
    claimed.set(spec, config)
  }
}

for (const spec of specs) {
  const owner = claimed.get(spec)

  if (owner) {
    // Claimed by a dedicated runner: every reader project must exclude it.
    const missing = projectIgnoreLists.filter((list) => !list.has(spec)).length
    if (missing > 0) {
      problems.push(
        `e2e/${spec} is claimed by ${owner}, but ${missing} of ${projectIgnoreLists.length} ` +
          `project blocks in ${READER_CONFIG} do not exclude it. It signs staff in, and the ` +
          `reader suite boots without newsroom auth — it will fail 503 at sign-in.`,
      )
    }
    continue
  }

  // Not claimed elsewhere: the reader suite must actually run it.
  if (readerIgnores.has(spec)) {
    problems.push(
      `e2e/${spec} is excluded from ${READER_CONFIG} but no dedicated config claims it, ` +
        `so it never runs. Give it a runner or stop excluding it.`,
    )
  }
  // `mobile.spec.ts` is the one spec the reader config routes by testMatch
  // rather than by directory; it is covered as long as some project names it.
  if (readerIgnores.has(spec) && readerMatchOnly.has(spec)) problems.pop()
}

for (const [spec, owner] of claimed) {
  if (!specs.includes(spec)) {
    problems.push(`${owner} claims e2e/${spec}, which does not exist.`)
  }
}

if (problems.length > 0) {
  console.error('E2E runner coverage audit failed:\n')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(
  `E2E runner coverage audit passed (${specs.length} specs; ` +
    `${claimed.size} on dedicated runners, ${specs.length - claimed.size} in the reader suite).`,
)
