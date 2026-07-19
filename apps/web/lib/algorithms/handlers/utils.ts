import type { AlgorithmMode, CapabilityResult } from '../types'

/** @deprecated use AlgorithmMode from '../types'; 'heuristic' is an alias the registry maps to 'local'. */
export type AlgorithmHandlerMode = AlgorithmMode | 'heuristic'

export type AlgorithmHandler = (input: Record<string, unknown>) => {
  score?: number
  detail: string
  mode?: AlgorithmHandlerMode
  ok?: boolean
  outputs?: Record<string, unknown>
  surface?: string
  /** Required when ok:false. */
  reason?: string
}

export function num(input: Record<string, unknown>, key: string, fallback = 0): number {
  const value = input[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function str(input: Record<string, unknown>, key: string, fallback = ''): string {
  const value = input[key]
  return typeof value === 'string' ? value : fallback
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function hashScore(id: string, salt = ''): number {
  let h = 2166136261
  const text = `${id}:${salt}`
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 10_000) / 10_000
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
      .map((t) => t.trim())
      .filter((t) => t.length > 1),
  )
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter += 1
  return inter / (a.size + b.size - inter)
}

type ResultOpts = {
  score?: number
  outputs?: Record<string, unknown>
  surface?: string
}

/** Build a successful CapabilityResult for a real product-library call. */
export function okProduction(detail: string, opts: ResultOpts = {}): CapabilityResult {
  return { ok: true, mode: 'production', detail, ...opts }
}

/** Build a successful CapabilityResult for an honest local computation. */
export function okLocal(detail: string, opts: ResultOpts = {}): CapabilityResult {
  return { ok: true, mode: 'local', detail, ...opts }
}

/** Build a successful CapabilityResult for an adapter-ready/-disabled id that still computed locally. */
export function okAdapter(
  mode: 'adapter-ready' | 'adapter-disabled',
  detail: string,
  opts: ResultOpts = {},
): CapabilityResult {
  return { ok: true, mode, detail, ...opts }
}

/** Build a failed CapabilityResult. `reason` is mandatory context for the honest failure. */
export function fail(
  mode: AlgorithmMode,
  reason: string,
  opts: ResultOpts & { detail?: string } = {},
): CapabilityResult {
  const { detail, ...rest } = opts
  return { ok: false, mode, detail: detail ?? reason, reason, ...rest }
}
