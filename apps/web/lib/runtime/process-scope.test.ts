import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Module scope is not process scope.
 *
 * Next builds the RSC/SSR graph and the route-handler graph as separate module
 * graphs, so a file imported by both is emitted into both and a top-level
 * `let` exists once per layer. `lib/runtime/process-singleton.ts` has the
 * evidence: two PGlite instances on one data directory, and four newsroom
 * symptoms that all traced back to it.
 *
 * The consequence is not tidiness. Two write queues guarding one JSON file are
 * two locks, which is no lock: a concurrent read-modify-write interleaves and
 * silently drops one of the writes. Two `schemaReady` promises run the same DDL
 * twice, on different handles, which is how a `CREATE TABLE IF NOT EXISTS` and
 * the `SELECT` after it disagreed about whether a table existed.
 *
 * So this asserts the rule structurally. Adding module-scope mutable state now
 * means adding the file to the allowlist below, on purpose, with a reason.
 */

const LIB_ROOT = path.resolve(__dirname, '..')

/**
 * Files that legitimately keep module-scope mutable state.
 *
 * `process-singleton.ts` is the registry itself. `sentry.ts` holds one boolean
 * set by the instrumentation hook and read by the health probe; it has no
 * imports at all, so it cannot reach the registry without becoming a server
 * module, and the flag is not shared state anyone makes a decision on.
 */
const ALLOWED = new Set([
  // The registry itself.
  'runtime/process-singleton.ts',
  // One boolean set by the instrumentation hook. The module has no imports at
  // all, so it cannot reach the registry without becoming a server module.
  'observability/sentry.ts',
  // Client-reachable: `components/reader/RecommendedForYou.tsx` imports this
  // through `personalize.ts`, so it runs in the browser bundle too and cannot
  // import the server-only registry. Its cache is per-bundle by construction.
  'reader/matrix-factorization.ts',
])

const TOP_LEVEL_MUTABLE = /^(?:let|var)\s+[A-Za-z_$]/

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      sourceFiles(full, out)
    } else if (
      entry.endsWith('.ts') &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.d.ts') &&
      !entry.endsWith('.test.tsx')
    ) {
      out.push(full)
    }
  }
  return out
}

describe('process scope', () => {
  const files = sourceFiles(LIB_ROOT)

  it('finds the library modules at all', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it('keeps module-scope mutable state inside processState', () => {
    const offenders = files
      .filter((file) => {
        const rel = path.relative(LIB_ROOT, file).replace(/\\/g, '/')
        if (ALLOWED.has(rel)) return false
        return readFileSync(file, 'utf8')
          .split('\n')
          .some((line) => TOP_LEVEL_MUTABLE.test(line))
      })
      .map((file) => path.relative(LIB_ROOT, file).replace(/\\/g, '/'))

    expect(
      offenders,
      'Top-level `let` in lib/ is per-layer state, not per-process. Wrap it in ' +
        'processState() (see lib/runtime/process-singleton.ts) or add the file to ' +
        'ALLOWED in this test with a reason.',
    ).toEqual([])
  })
})
