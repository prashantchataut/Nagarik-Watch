/**
 * Unified algorithm runtime: every catalog id resolves through the
 * capability registry to a dedicated handler. Results are honest — `ok` can
 * be `false`, and a `reason` accompanies every failure. Modes:
 *   production       — calls real product libraries
 *   local            — honest local computation without inventing traffic
 *   adapter-ready    — local path runs; external vendor can enhance
 *   adapter-disabled — vendor/CDN not configured; local computation still runs
 */
import { ALGORITHM_CATALOG } from './catalog'
import { getCapability } from './capabilities/registry'
import { defaultFixtureFor } from './fixtures'
import { isNewsroomWired, isPlatformWired, isProductWired } from './product-surfaces'
import type { AlgorithmMode } from './types'

/**
 * Where a run's input came from.
 *   caller  — the caller supplied the data; the result describes real state
 *   fixture — nothing was supplied, so `defaultFixtureFor(id)` stood in
 *   mixed   — the caller supplied some fields, the fixture filled the rest
 *
 * `ok: true` says the handler completed. It has never said the numbers mean
 * anything, and on the admin panel — which passes no input at all — they
 * mostly do not. Reporting provenance is what lets the panel stop implying
 * otherwise.
 */
export type AlgorithmInputSource = 'caller' | 'fixture' | 'mixed'

export type AlgorithmRunResult = {
  id: string
  number: number
  ok: boolean
  mode: AlgorithmMode
  score?: number
  detail: string
  ms: number
  surface?: string
  outputs?: Record<string, unknown>
  reason?: string
  /** Provenance of the input this result was computed from. */
  input: AlgorithmInputSource
  /** True when a reader-facing surface consumes this algorithm in production. */
  productWired: boolean
}

function inputSource(id: string, input: Record<string, unknown>): AlgorithmInputSource {
  const supplied = Object.keys(input)
  if (supplied.length === 0) return 'fixture'
  const fixtureKeys = Object.keys(defaultFixtureFor(id))
  if (fixtureKeys.length === 0) return 'caller'
  return supplied.some((key) => !fixtureKeys.includes(key)) ||
    fixtureKeys.every((key) => supplied.includes(key))
    ? 'caller'
    : 'mixed'
}

export function runAlgorithm(id: string, input: Record<string, unknown> = {}): AlgorithmRunResult {
  const started = Date.now()
  const entry = ALGORITHM_CATALOG.find((item) => item.id === id)
  const number = entry?.number ?? 0
  const capability = getCapability(id)
  const source = inputSource(id, input)
  const productWired = isProductWired(id)

  if (!capability) {
    return {
      id,
      number,
      ok: false,
      mode: 'local',
      detail: `no dedicated capability handler registered for ${id}`,
      reason: 'no dedicated capability handler',
      surface: entry?.surface,
      ms: Math.max(0, Date.now() - started),
      input: source,
      productWired,
    }
  }

  const merged = { ...defaultFixtureFor(id), ...input }

  try {
    const result = capability.run(merged)
    return {
      id,
      number,
      ok: result.ok,
      mode: result.mode,
      score: result.score,
      detail: result.detail,
      outputs: result.outputs,
      surface: result.surface ?? capability.surface ?? entry?.surface,
      reason: result.reason,
      ms: Math.max(0, Date.now() - started),
      input: source,
      productWired,
    }
  } catch (error) {
    // Contract: never throw to callers — but never fake ok:true either.
    const message = error instanceof Error ? error.message : 'unknown error'
    return {
      id,
      number,
      ok: false,
      mode: capability.mode,
      detail: `handler threw: ${message}`,
      reason: message,
      surface: capability.surface ?? entry?.surface,
      ms: Math.max(0, Date.now() - started),
      input: source,
      productWired,
    }
  }
}

export function runAllAlgorithms(input: Record<string, unknown> = {}): AlgorithmRunResult[] {
  return ALGORITHM_CATALOG.map((entry) => runAlgorithm(entry.id, input))
}

/**
 * The numbers the admin panel should lead with. "232 live, 0 failures" is true
 * and useless on its own; these say how much of that is real.
 */
export function algorithmRuntimeHonesty(results: AlgorithmRunResult[]) {
  return {
    total: results.length,
    ok: results.filter((result) => result.ok).length,
    productWired: results.filter((result) => result.productWired).length,
    // Counted separately, never folded into `productWired`: a desk page or an
    // admin route consuming an algorithm is a real surface, but it is not a
    // reader, and merging the two would re-inflate the headline.
    newsroomWired: results.filter((result) => isNewsroomWired(result.id)).length,
    // Same reasoning again for the ones that ship as config, middleware, CSS or
    // a CI job: nothing imports them, so the graph cannot see them, but they
    // are deployed and "panel-only" would be a lie about them too.
    platformWired: results.filter((result) => isPlatformWired(result.id)).length,
    fixtureOnly: results.filter((result) => result.input === 'fixture').length,
    withOutputs: results.filter(
      (result) => result.outputs && Object.keys(result.outputs).length > 0,
    ).length,
  }
}

export function algorithmRuntimeModeCounts(results: AlgorithmRunResult[]) {
  const counts: Record<AlgorithmMode, number> = {
    production: 0,
    local: 0,
    'adapter-ready': 0,
    'adapter-disabled': 0,
  }
  for (const result of results) counts[result.mode] += 1
  return counts
}
