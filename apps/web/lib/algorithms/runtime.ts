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
import type { AlgorithmMode } from './types'

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
}

export function runAlgorithm(
  id: string,
  input: Record<string, unknown> = {},
): AlgorithmRunResult {
  const started = Date.now()
  const entry = ALGORITHM_CATALOG.find((item) => item.id === id)
  const number = entry?.number ?? 0
  const capability = getCapability(id)

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
    }
  }
}

export function runAllAlgorithms(input: Record<string, unknown> = {}): AlgorithmRunResult[] {
  return ALGORITHM_CATALOG.map((entry) => runAlgorithm(entry.id, input))
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
