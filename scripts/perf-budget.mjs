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
 * Env overrides:
 *   PERF_BUDGET_MAX_JS_KB   per-chunk ceiling in KiB (default 500)
 *   PERF_BUDGET_DIR         directory of chunks to scan (default apps/web build)
 *
 * CLI flags (override env):
 *   --dir <path>            directory of *.js chunks to scan
 *   --max-kb <n>            per-chunk ceiling in KiB
 *   --gzip                  budget on gzipped size instead of raw size
 *   --self-test             run internal fixtures and exit
 */
import { readdirSync, readFileSync, statSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const KIB = 1024
const DEFAULT_MAX_KB = 500

function parseArgs(argv) {
  const args = { dir: null, maxKb: null, gzip: false, selfTest: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--self-test') args.selfTest = true
    else if (arg === '--gzip') args.gzip = true
    else if (arg === '--dir') args.dir = argv[++i]
    else if (arg === '--max-kb') args.maxKb = Number(argv[++i])
  }
  return args
}

/** Recursively collect every *.js file below `dir`. */
function collectJsFiles(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...collectJsFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.js')) found.push(full)
  }
  return found
}

/**
 * Pure budget check. Returns every chunk plus whichever exceed `maxBytes`.
 * Kept side-effect free so it can be exercised by fixtures.
 */
export function checkBudget(dir, maxBytes, { gzip = false } = {}) {
  const chunks = collectJsFiles(dir).map((file) => {
    const raw = readFileSync(file)
    const size = gzip ? gzipSync(raw).length : raw.length
    return { file, size }
  })
  chunks.sort((a, b) => b.size - a.size)
  const oversized = chunks.filter((chunk) => chunk.size > maxBytes)
  return { chunks, oversized }
}

function kb(bytes) {
  return (bytes / KIB).toFixed(1)
}

function runSelfTest() {
  const work = mkdtempSync(join(tmpdir(), 'perf-budget-'))
  const failures = []
  try {
    // A tiny chunk (well under budget) and a large chunk (over a small budget).
    writeFileSync(join(work, 'small.js'), 'a'.repeat(10 * KIB))
    writeFileSync(join(work, 'large.js'), 'b'.repeat(40 * KIB))

    const under = checkBudget(work, 50 * KIB)
    if (under.oversized.length !== 0) failures.push('expected no oversized chunks at 50 KiB budget')
    if (under.chunks.length !== 2) failures.push(`expected 2 chunks, saw ${under.chunks.length}`)
    if (under.chunks[0].file.endsWith('small.js')) failures.push('chunks must sort largest-first')

    const over = checkBudget(work, 20 * KIB)
    if (over.oversized.length !== 1) failures.push(`expected 1 oversized chunk at 20 KiB, saw ${over.oversized.length}`)
    if (over.oversized[0] && !over.oversized[0].file.endsWith('large.js')) {
      failures.push('wrong chunk flagged as oversized')
    }

    // Gzip of highly-compressible content must be far smaller than raw.
    const gz = checkBudget(work, 20 * KIB, { gzip: true })
    if (gz.oversized.length !== 0) failures.push('gzip sizing should keep repetitive fixtures under budget')
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

  const envMaxKb = Number(process.env.PERF_BUDGET_MAX_JS_KB)
  const maxKb = args.maxKb ?? (Number.isFinite(envMaxKb) && envMaxKb > 0 ? envMaxKb : DEFAULT_MAX_KB)
  const dir =
    args.dir ??
    process.env.PERF_BUDGET_DIR ??
    join(process.cwd(), 'apps', 'web', '.next', 'static', 'chunks')
  const gzip = args.gzip
  const maxBytes = maxKb * KIB

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

  const { chunks, oversized } = checkBudget(dir, maxBytes, { gzip })
  const label = gzip ? 'gzipped' : 'raw'

  if (chunks.length === 0) {
    console.error(`Performance budget: no .js chunks found in ${dir}`)
    process.exit(1)
  }

  const top = chunks.slice(0, 5)
  console.log(`Performance budget: per-chunk ceiling ${maxKb} KiB (${label}). Largest chunks:`)
  for (const chunk of top) console.log(`- ${kb(chunk.size)} KiB  ${chunk.file}`)

  if (oversized.length) {
    console.error(`\nPerformance budget FAILED: ${oversized.length} chunk(s) exceed ${maxKb} KiB (${label}):`)
    for (const chunk of oversized) console.error(`- ${kb(chunk.size)} KiB  ${chunk.file}`)
    console.error('\nSplit the chunk, defer the dependency, or raise PERF_BUDGET_MAX_JS_KB deliberately.')
    process.exit(1)
  }

  console.log(`\nPerformance budget passed: ${chunks.length} chunk(s) within ${maxKb} KiB (${label}).`)
}

// Only run the CLI when executed directly, not when imported for its exports.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main()
}
