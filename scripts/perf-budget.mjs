#!/usr/bin/env node
/**
 * Repository-native performance budget.
 *
 * This checks only budgets we can prove from build artifacts — namely the
 * on-disk size of the public static JavaScript chunks Next.js emits under
 * `apps/web/.next/static/chunks`. It deliberately does NOT fabricate lab
 * metrics (LCP/CLS/etc.); those require a real browser and are out of scope.
 *
 * Budget: no single client chunk may exceed the per-chunk ceiling. The ceiling
 * is uncompressed KiB by default (deterministic and simple to reason about);
 * pass `--gzip` to budget on gzipped transfer size instead.
 *
 * ## Eager and on-demand chunks are budgeted separately
 *
 * An earlier version applied one ceiling to every emitted chunk, which made it
 * punish the fix and reward the defect. Moving the 82 KB Sentry SDK behind a
 * dynamic `import()` in `instrumentation-client.ts` cut ~97 KB off what every
 * reader downloads, and the budget failed the change — because the SDK, no
 * longer spread thin across the eagerly-loaded chunks, was now one 568 KiB
 * chunk that no page fetches. Leaving it in the entry graph would have passed.
 *
 * So a chunk is classified from the build's own manifests before it is judged:
 *
 * - **eager** — named by `build-manifest.json` (`rootMainFiles`, `polyfillFiles`)
 *   or by any route's `server/app/**\/*_client-reference-manifest.js`. The
 *   browser fetches these to render the route, so they are first-paint weight
 *   and get the tight ceiling.
 * - **on-demand** — every other emitted chunk. Reached only through a runtime
 *   `import()`, after the page is interactive. Still bounded, because it is
 *   still bytes over a Nepali mobile connection, but bounded loosely.
 *
 * If no manifest can be read the split is not attempted and every chunk is
 * treated as eager, which is the stricter of the two readings. A gate that
 * cannot prove a chunk is deferred must not assume it.
 *
 * Env overrides:
 *   PERF_BUDGET_MAX_JS_KB        eager per-chunk ceiling in KiB (default 500)
 *   PERF_BUDGET_MAX_LAZY_JS_KB   on-demand per-chunk ceiling in KiB (default 1024)
 *   PERF_BUDGET_DIR              directory of chunks to scan (default apps/web build)
 *
 * CLI flags (override env):
 *   --dir <path>            directory of *.js chunks to scan
 *   --max-kb <n>            eager per-chunk ceiling in KiB
 *   --max-lazy-kb <n>       on-demand per-chunk ceiling in KiB
 *   --gzip                  budget on gzipped size instead of raw size
 *   --self-test             run internal fixtures and exit
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const KIB = 1024
const DEFAULT_MAX_KB = 500

/**
 * An on-demand chunk is never in the critical path: nothing fetches it until a
 * reader uses the feature behind it. It is still capped, at roughly twice the
 * eager ceiling, so that "make it lazy" cannot become a way to smuggle an
 * unbounded dependency into the app — a 5 MB lazy chunk is still 5 MB for the
 * reader who opens that feature.
 */
const DEFAULT_MAX_LAZY_KB = 1024

function parseArgs(argv) {
  const args = { dir: null, maxKb: null, maxLazyKb: null, gzip: false, selfTest: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--self-test') args.selfTest = true
    else if (arg === '--gzip') args.gzip = true
    else if (arg === '--dir') args.dir = argv[++i]
    else if (arg === '--max-kb') args.maxKb = Number(argv[++i])
    else if (arg === '--max-lazy-kb') args.maxLazyKb = Number(argv[++i])
  }
  return args
}

/** Recursively collect every file below `dir` whose name passes `keep`. */
function collectFiles(dir, keep) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...collectFiles(full, keep))
    else if (entry.isFile() && keep(entry.name)) found.push(full)
  }
  return found
}

const collectJsFiles = (dir) => collectFiles(dir, (name) => name.endsWith('.js'))

/**
 * Every chunk basename the build says a route loads to render itself.
 *
 * Returns `null` — not an empty set — when the build directory holds no
 * manifest to read, so the caller can tell "nothing is eager" from "eagerness
 * is unknowable here" and fall back to judging everything strictly.
 *
 * Basenames, not paths: the manifests spell the same chunk three ways
 * (`static/chunks/x.js`, `/_next/static/chunks/x.js`, and with a deployment
 * prefix), and the filenames are content-hashed, so the leaf is both stable and
 * unique.
 */
export function collectEagerChunkNames(nextDir) {
  const names = new Set()
  let sawManifest = false

  const buildManifest = join(nextDir, 'build-manifest.json')
  if (existsSync(buildManifest)) {
    sawManifest = true
    const manifest = JSON.parse(readFileSync(buildManifest, 'utf8'))
    // `pages` is legacy-router routes; `rootMainFiles` and `polyfillFiles` are
    // the App Router entry. `lowPriorityFiles` is build metadata, not code.
    for (const group of [manifest.rootMainFiles, manifest.polyfillFiles]) {
      for (const file of group ?? []) names.add(basename(file))
    }
    for (const files of Object.values(manifest.pages ?? {})) {
      if (Array.isArray(files)) for (const file of files) names.add(basename(file))
    }
  }

  // Per-route client component graphs. Each `clientModules` entry carries the
  // chunks that module needs, which together are the route's client payload.
  const appDir = join(nextDir, 'server', 'app')
  if (existsSync(appDir)) {
    const manifests = collectFiles(appDir, (name) => name.endsWith('_client-reference-manifest.js'))
    if (manifests.length) sawManifest = true
    for (const file of manifests) {
      const source = readFileSync(file, 'utf8')
      for (const [, list] of source.matchAll(/"chunks":\s*\[([^\]]*)\]/g)) {
        for (const [, name] of list.matchAll(/"([^"]+\.js)"/g)) names.add(basename(name))
      }
    }
  }

  return sawManifest ? names : null
}

/**
 * Pure budget check. Returns every chunk plus whichever exceed their ceiling.
 * Kept side-effect free so it can be exercised by fixtures.
 *
 * `eagerNames` is the set from `collectEagerChunkNames`; pass `null` to budget
 * every chunk at `maxBytes`.
 */
export function checkBudget(dir, maxBytes, { gzip = false, eagerNames = null, lazyMaxBytes } = {}) {
  const lazyCeiling = lazyMaxBytes ?? maxBytes
  const chunks = collectJsFiles(dir).map((file) => {
    const raw = readFileSync(file)
    const size = gzip ? gzipSync(raw).length : raw.length
    const eager = eagerNames === null || eagerNames.has(basename(file))
    return { file, size, eager, ceiling: eager ? maxBytes : lazyCeiling }
  })
  chunks.sort((a, b) => b.size - a.size)
  const oversized = chunks.filter((chunk) => chunk.size > chunk.ceiling)
  return { chunks, oversized }
}

function kb(bytes) {
  return (bytes / KIB).toFixed(1)
}

function runSelfTest() {
  const work = mkdtempSync(join(tmpdir(), 'perf-budget-'))
  const failures = []
  const expect = (condition, message) => {
    if (!condition) failures.push(message)
  }
  try {
    // A tiny chunk (well under budget) and a large chunk (over a small budget).
    const chunkDir = join(work, 'static', 'chunks')
    mkdirSync(chunkDir, { recursive: true })
    writeFileSync(join(chunkDir, 'small.js'), 'a'.repeat(10 * KIB))
    writeFileSync(join(chunkDir, 'large.js'), 'b'.repeat(40 * KIB))

    const under = checkBudget(chunkDir, 50 * KIB)
    expect(under.oversized.length === 0, 'expected no oversized chunks at 50 KiB budget')
    expect(under.chunks.length === 2, `expected 2 chunks, saw ${under.chunks.length}`)
    expect(!under.chunks[0].file.endsWith('small.js'), 'chunks must sort largest-first')

    const over = checkBudget(chunkDir, 20 * KIB)
    expect(
      over.oversized.length === 1,
      `expected 1 oversized chunk at 20 KiB, saw ${over.oversized.length}`,
    )
    expect(
      !over.oversized[0] || over.oversized[0].file.endsWith('large.js'),
      'wrong chunk flagged as oversized',
    )

    // Gzip of highly-compressible content must be far smaller than raw.
    const gz = checkBudget(chunkDir, 20 * KIB, { gzip: true })
    expect(gz.oversized.length === 0, 'gzip sizing should keep repetitive fixtures under budget')

    // With no manifests at all, eagerness is unknowable and every chunk must be
    // judged at the tight ceiling rather than waved through as deferred.
    expect(
      collectEagerChunkNames(work) === null,
      'a build directory with no manifest must report unknown, not empty',
    )
    const unknown = checkBudget(chunkDir, 20 * KIB, {
      eagerNames: collectEagerChunkNames(work),
      lazyMaxBytes: 500 * KIB,
    })
    expect(
      unknown.oversized.length === 1,
      'an unreadable build must fall back to budgeting every chunk eagerly',
    )

    // Now give the build a manifest naming only `small.js` as eager. `large.js`
    // becomes on-demand and is judged at the looser ceiling.
    writeFileSync(
      join(work, 'build-manifest.json'),
      JSON.stringify({ rootMainFiles: ['static/chunks/small.js'], polyfillFiles: [], pages: {} }),
    )
    const eagerNames = collectEagerChunkNames(work)
    expect(eagerNames instanceof Set && eagerNames.has('small.js'), 'rootMainFiles must be eager')
    expect(eagerNames !== null && !eagerNames.has('large.js'), 'unnamed chunks must not be eager')

    const split = checkBudget(chunkDir, 20 * KIB, { eagerNames, lazyMaxBytes: 50 * KIB })
    expect(split.oversized.length === 0, 'a deferred chunk under the lazy ceiling must pass')
    expect(
      split.chunks.every((chunk) => chunk.eager === chunk.file.endsWith('small.js')),
      'chunks must be classified by manifest membership',
    )

    // The lazy ceiling is a ceiling, not an exemption.
    const tightLazy = checkBudget(chunkDir, 20 * KIB, { eagerNames, lazyMaxBytes: 30 * KIB })
    expect(tightLazy.oversized.length === 1, 'a deferred chunk over the lazy ceiling must fail')

    // A route manifest is read as well as the build manifest, so a chunk that
    // only a route pulls in is still first-paint weight.
    const routeDir = join(work, 'server', 'app')
    mkdirSync(routeDir, { recursive: true })
    writeFileSync(
      join(routeDir, 'page_client-reference-manifest.js'),
      'globalThis.__RSC_MANIFEST["/page"]={"clientModules":{"m":{"id":1,"name":"*",' +
        '"chunks":["/_next/static/chunks/large.js"],"async":false}}};',
    )
    const withRoute = collectEagerChunkNames(work)
    expect(withRoute !== null && withRoute.has('large.js'), 'route manifest chunks must be eager')
    const routed = checkBudget(chunkDir, 20 * KIB, {
      eagerNames: withRoute,
      lazyMaxBytes: 500 * KIB,
    })
    expect(routed.oversized.length === 1, 'a route-loaded chunk must be judged eagerly')
  } finally {
    rmSync(work, { recursive: true, force: true })
  }

  if (failures.length) {
    console.error('perf-budget self-test FAILED:')
    for (const failure of failures) console.error(`- ${failure}`)
    process.exit(1)
  }
  console.log('perf-budget self-test passed.')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.selfTest) {
    runSelfTest()
    return
  }

  const positive = (value) => (Number.isFinite(value) && value > 0 ? value : null)
  const maxKb = args.maxKb ?? positive(Number(process.env.PERF_BUDGET_MAX_JS_KB)) ?? DEFAULT_MAX_KB
  const maxLazyKb =
    args.maxLazyKb ??
    positive(Number(process.env.PERF_BUDGET_MAX_LAZY_JS_KB)) ??
    DEFAULT_MAX_LAZY_KB
  const dir =
    args.dir ??
    process.env.PERF_BUDGET_DIR ??
    join(process.cwd(), 'apps', 'web', '.next', 'static', 'chunks')
  const gzip = args.gzip
  const maxBytes = maxKb * KIB
  const lazyMaxBytes = Math.max(maxLazyKb, maxKb) * KIB

  let stats
  try {
    stats = statSync(dir)
  } catch {
    console.error(`Performance budget: chunk directory not found: ${dir}`)
    console.error('Run the web build first (pnpm build:web) or pass --dir.')
    process.exit(1)
  }
  if (!stats.isDirectory()) {
    console.error(`Performance budget: not a directory: ${dir}`)
    process.exit(1)
  }

  // The chunk directory is `<build>/static/chunks`; the manifests live at the
  // build root. Resolving up from `--dir` keeps the two in step when the dir is
  // overridden to point at another build.
  const nextDir = resolve(dir, '..', '..')
  const eagerNames = collectEagerChunkNames(nextDir)

  const { chunks, oversized } = checkBudget(dir, maxBytes, { gzip, eagerNames, lazyMaxBytes })
  const label = gzip ? 'gzipped' : 'raw'

  if (chunks.length === 0) {
    console.error(`Performance budget: no .js chunks found in ${dir}`)
    process.exit(1)
  }

  if (eagerNames === null) {
    console.log(
      `Performance budget: no build manifest under ${nextDir}; budgeting every chunk at the eager ceiling.`,
    )
  }
  const eagerCount = chunks.filter((chunk) => chunk.eager).length
  console.log(
    `Performance budget: ${maxKb} KiB per eager chunk, ${maxLazyKb} KiB per on-demand chunk (${label}).`,
  )
  console.log(`${eagerCount} eager, ${chunks.length - eagerCount} on-demand. Largest chunks:`)
  for (const chunk of chunks.slice(0, 5)) {
    console.log(
      `- ${kb(chunk.size)} KiB  ${chunk.eager ? 'eager     ' : 'on-demand '} ${chunk.file}`,
    )
  }

  if (oversized.length) {
    console.error(
      `\nPerformance budget FAILED: ${oversized.length} chunk(s) over ceiling (${label}):`,
    )
    for (const chunk of oversized) {
      console.error(
        `- ${kb(chunk.size)} KiB  ${chunk.eager ? 'eager' : 'on-demand'} (ceiling ${kb(chunk.ceiling)} KiB)  ${chunk.file}`,
      )
    }
    console.error(
      '\nSplit the chunk, defer the dependency behind a dynamic import, or raise the ceiling deliberately.',
    )
    process.exit(1)
  }

  console.log(`\nPerformance budget passed: ${chunks.length} chunk(s) within ceiling (${label}).`)
}

// Only run the CLI when executed directly, not when imported for its exports.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
