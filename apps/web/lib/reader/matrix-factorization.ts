/**
 * Implicit-feedback matrix factorization over the consented interaction matrix.
 *
 * The catalog has carried "Matrix Factorization" as a live algorithm whose
 * summary said it was "not justified until a CF baseline exists". The baseline
 * does exist now — `lib/engagement/interaction-matrix.ts` collects reader ×
 * article weights, and `recommend()` already uses them for co-read — so this
 * implements the thing rather than describing it.
 *
 * Alternating least squares on implicit feedback (Hu, Koren & Volinsky 2008):
 * every observed weight becomes a confidence `1 + alpha·w` on a preference of
 * 1, unobserved pairs stay at confidence 1 on a preference of 0, and reader and
 * item factors are solved for in turn. With a handful of factors and a matrix
 * this size it is a few milliseconds of arithmetic — no training job, no model
 * artifact, no vendor.
 *
 * What it adds over co-read: co-read can only connect two stories some single
 * reader opened together. Factors generalise — a reader whose history rhymes
 * with a cohort inherits that cohort's taste for a story nobody in their own
 * history touched.
 *
 * It refuses to run below a volume floor. Fitted on three readers it would
 * produce confident numbers describing nothing, which is worse than no
 * recommendation at all.
 */
import type { InteractionMatrix } from '../engagement/interaction-matrix'

export type FactorModel = {
  factors: number
  readers: Map<string, Float64Array>
  items: Map<string, Float64Array>
  /** Item order the factors were fitted in; also the fold-in's column order. */
  itemIds: string[]
}

export type FactorizeOptions = {
  factors?: number
  iterations?: number
  /** Ridge term; keeps factors from chasing a single heavy reader. */
  regularization?: number
  /** How much an observed interaction outweighs an unobserved one. */
  alpha?: number
}

/**
 * Volume floors. Below these the factorization is fitting noise: with fewer
 * readers than factors the solution is underdetermined, and with a handful of
 * items every reader looks like every other.
 */
export const MF_MIN_READERS = 12
export const MF_MIN_ITEMS = 8

const DEFAULTS = { factors: 8, iterations: 12, regularization: 0.08, alpha: 24 } as const

/** Deterministic PRNG, so the same matrix always produces the same model. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randomFactors(count: number, factors: number, random: () => number): Float64Array[] {
  return Array.from({ length: count }, () => {
    const vector = new Float64Array(factors)
    for (let f = 0; f < factors; f += 1) vector[f] = (random() - 0.5) * 0.1
    return vector
  })
}

/** Gram matrix XᵀX for the current side, computed once per half-iteration. */
function gram(vectors: Float64Array[], factors: number): Float64Array {
  const out = new Float64Array(factors * factors)
  for (const vector of vectors) {
    for (let i = 0; i < factors; i += 1) {
      const vi = vector[i] ?? 0
      if (vi === 0) continue
      for (let j = i; j < factors; j += 1) {
        out[i * factors + j] = (out[i * factors + j] ?? 0) + vi * (vector[j] ?? 0)
      }
    }
  }
  // Mirror the upper triangle rather than doing twice the multiplications.
  for (let i = 0; i < factors; i += 1) {
    for (let j = i + 1; j < factors; j += 1) out[j * factors + i] = out[i * factors + j] ?? 0
  }
  return out
}

/** Solve `A x = b` for a small symmetric positive-definite A, in place. */
function solve(a: Float64Array, b: Float64Array, n: number): Float64Array {
  const matrix = Float64Array.from(a)
  const rhs = Float64Array.from(b)
  for (let col = 0; col < n; col += 1) {
    let pivotRow = col
    let best = Math.abs(matrix[col * n + col] ?? 0)
    for (let row = col + 1; row < n; row += 1) {
      const value = Math.abs(matrix[row * n + col] ?? 0)
      if (value > best) {
        best = value
        pivotRow = row
      }
    }
    if (best < 1e-12) continue
    if (pivotRow !== col) {
      for (let k = 0; k < n; k += 1) {
        const tmp = matrix[col * n + k] ?? 0
        matrix[col * n + k] = matrix[pivotRow * n + k] ?? 0
        matrix[pivotRow * n + k] = tmp
      }
      const tmp = rhs[col] ?? 0
      rhs[col] = rhs[pivotRow] ?? 0
      rhs[pivotRow] = tmp
    }
    const pivot = matrix[col * n + col] ?? 1
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue
      const factor = (matrix[row * n + col] ?? 0) / pivot
      if (factor === 0) continue
      for (let k = col; k < n; k += 1) {
        matrix[row * n + k] = (matrix[row * n + k] ?? 0) - factor * (matrix[col * n + k] ?? 0)
      }
      rhs[row] = (rhs[row] ?? 0) - factor * (rhs[col] ?? 0)
    }
  }
  const out = new Float64Array(n)
  for (let i = 0; i < n; i += 1) {
    const pivot = matrix[i * n + i] ?? 0
    out[i] = Math.abs(pivot) < 1e-12 ? 0 : (rhs[i] ?? 0) / pivot
  }
  return out
}

/**
 * One ALS half-step: re-solve every row of `target` against the fixed `other`
 * side, given that row's observed (index, weight) pairs.
 */
function solveSide(
  target: Float64Array[],
  other: Float64Array[],
  observations: Array<Array<[number, number]>>,
  factors: number,
  regularization: number,
  alpha: number,
): void {
  const base = gram(other, factors)
  for (let row = 0; row < target.length; row += 1) {
    const seen = observations[row] ?? []
    if (seen.length === 0) {
      target[row] = new Float64Array(factors)
      continue
    }
    const a = Float64Array.from(base)
    const b = new Float64Array(factors)
    for (let i = 0; i < factors; i += 1)
      a[i * factors + i] = (a[i * factors + i] ?? 0) + regularization
    for (const [index, weight] of seen) {
      const vector = other[index]
      if (!vector) continue
      // confidence − 1, because the full YᵀY term above already covers the 1.
      const confidence = alpha * weight
      for (let i = 0; i < factors; i += 1) {
        const vi = vector[i] ?? 0
        if (vi === 0) continue
        b[i] = (b[i] ?? 0) + vi * (confidence + 1)
        for (let j = 0; j < factors; j += 1) {
          a[i * factors + j] = (a[i * factors + j] ?? 0) + confidence * vi * (vector[j] ?? 0)
        }
      }
    }
    target[row] = solve(a, b, factors)
  }
}

export function factorizeInteractions(
  matrix: InteractionMatrix,
  options: FactorizeOptions = {},
): FactorModel | null {
  const readerKeys = Object.keys(matrix).filter((key) => Object.keys(matrix[key] ?? {}).length > 0)
  const itemIds = [...new Set(readerKeys.flatMap((key) => Object.keys(matrix[key] ?? {})))]
  if (readerKeys.length < MF_MIN_READERS || itemIds.length < MF_MIN_ITEMS) return null

  const factors = Math.max(2, Math.min(options.factors ?? DEFAULTS.factors, itemIds.length - 1))
  const iterations = options.iterations ?? DEFAULTS.iterations
  const regularization = options.regularization ?? DEFAULTS.regularization
  const alpha = options.alpha ?? DEFAULTS.alpha

  const itemIndex = new Map(itemIds.map((id, index) => [id, index]))
  const byReader: Array<Array<[number, number]>> = readerKeys.map((key) => {
    const row = matrix[key] ?? {}
    const entries: Array<[number, number]> = []
    for (const [itemId, weight] of Object.entries(row)) {
      const index = itemIndex.get(itemId)
      if (index === undefined || !Number.isFinite(weight) || weight <= 0) continue
      // Weights are visit counts and dwell blends; the log keeps a single
      // obsessive reader from dominating a factor.
      entries.push([index, Math.log1p(weight)])
    }
    return entries
  })
  const byItem: Array<Array<[number, number]>> = itemIds.map(() => [])
  byReader.forEach((entries, readerIndex) => {
    for (const [itemIdx, weight] of entries) byItem[itemIdx]?.push([readerIndex, weight])
  })

  const random = mulberry32(readerKeys.length * 1_000_003 + itemIds.length)
  const readerFactors = randomFactors(readerKeys.length, factors, random)
  const itemFactors = randomFactors(itemIds.length, factors, random)

  for (let step = 0; step < iterations; step += 1) {
    solveSide(readerFactors, itemFactors, byReader, factors, regularization, alpha)
    solveSide(itemFactors, readerFactors, byItem, factors, regularization, alpha)
  }

  return {
    factors,
    readers: new Map(
      readerKeys.map((key, index) => [key, readerFactors[index] ?? new Float64Array(factors)]),
    ),
    items: new Map(
      itemIds.map((id, index) => [id, itemFactors[index] ?? new Float64Array(factors)]),
    ),
    itemIds,
  }
}

/**
 * Factors for a reader the model was not fitted on.
 *
 * A reader who arrived after the last rebuild still has a history; holding the
 * item factors fixed and solving the one ridge regression for their row is the
 * standard fold-in, and it costs one k×k solve.
 */
export function foldInReader(model: FactorModel, weights: Record<string, number>): Float64Array {
  const observations: Array<[number, number]> = []
  const indexed = new Map(model.itemIds.map((id, index) => [id, index]))
  const itemVectors = model.itemIds.map(
    (id) => model.items.get(id) ?? new Float64Array(model.factors),
  )
  for (const [itemId, weight] of Object.entries(weights)) {
    const index = indexed.get(itemId)
    if (index === undefined || !Number.isFinite(weight) || weight <= 0) continue
    observations.push([index, Math.log1p(weight)])
  }
  if (observations.length === 0) return new Float64Array(model.factors)
  const target = [new Float64Array(model.factors)]
  solveSide(
    target,
    itemVectors,
    [observations],
    model.factors,
    DEFAULTS.regularization,
    DEFAULTS.alpha,
  )
  return target[0] ?? new Float64Array(model.factors)
}

/**
 * Scores in 0..1 for the given candidates, or an empty map when the reader has
 * no factors at all. Normalized within the candidate set, because the raw dot
 * products have no meaningful scale to compare across readers.
 */
export function factorizedScores(
  model: FactorModel,
  readerFactors: Float64Array | undefined,
  candidateIds: readonly string[],
): Map<string, number> {
  const out = new Map<string, number>()
  if (!readerFactors || readerFactors.length === 0) return out

  const raw: Array<[string, number]> = []
  let min = Infinity
  let max = -Infinity
  for (const id of candidateIds) {
    const item = model.items.get(id)
    if (!item) continue
    let dot = 0
    for (let f = 0; f < model.factors; f += 1) dot += (readerFactors[f] ?? 0) * (item[f] ?? 0)
    raw.push([id, dot])
    if (dot < min) min = dot
    if (dot > max) max = dot
  }
  if (raw.length === 0) return out

  const span = max - min
  for (const [id, dot] of raw) out.set(id, span > 1e-9 ? (dot - min) / span : 0)
  return out
}

/**
 * Cached fit, keyed on the shape of the matrix it was fitted to.
 *
 * The matrix is rebuilt by a cron, not per request, so a request that sees the
 * same reader and item counts sees the same data. The key is deliberately
 * cheap: a wrong cache hit costs one stale ranking uplift, and hashing 5,000
 * rows per request to avoid it would cost more than refitting.
 */
let cached: { key: string; model: FactorModel | null } | null = null

export function factorizeInteractionsCached(matrix: InteractionMatrix): FactorModel | null {
  const readerKeys = Object.keys(matrix)
  const key = `${readerKeys.length}:${readerKeys.slice(0, 4).join(',')}:${readerKeys.reduce(
    (total, reader) => total + Object.keys(matrix[reader] ?? {}).length,
    0,
  )}`
  if (cached?.key === key) return cached.model
  const model = factorizeInteractions(matrix)
  cached = { key, model }
  return model
}

export function __resetFactorModelCacheForTests(): void {
  cached = null
}
