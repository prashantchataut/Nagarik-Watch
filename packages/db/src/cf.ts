/**
 * Small, pure collaborative-filtering baselines.
 *
 * These helpers intentionally operate on caller-supplied, consented interaction
 * matrices. They do not imply that Nagarik Watch has enough traffic to run CF
 * in production yet.
 */
export type SparseVector = ReadonlyMap<string, number>
export type InteractionMatrix = Readonly<Record<string, Readonly<Record<string, number>>>>

export type ItemRecommendation = {
  itemId: string
  score: number
  supportingItems: number
}

export function vectorCosine(a: SparseVector, b: SparseVector): number {
  if (a.size === 0 || b.size === 0) return 0
  let dot = 0
  let aNorm = 0
  let bNorm = 0
  for (const value of a.values()) aNorm += value * value
  for (const value of b.values()) bNorm += value * value
  if (aNorm === 0 || bNorm === 0) return 0
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const [key, value] of small) dot += value * (large.get(key) ?? 0)
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm))
}

function itemVectors(matrix: InteractionMatrix): Map<string, Map<string, number>> {
  const vectors = new Map<string, Map<string, number>>()
  for (const [readerId, interactions] of Object.entries(matrix)) {
    for (const [itemId, value] of Object.entries(interactions)) {
      if (!Number.isFinite(value) || value <= 0) continue
      const vector = vectors.get(itemId) ?? new Map<string, number>()
      vector.set(readerId, value)
      vectors.set(itemId, vector)
    }
  }
  return vectors
}

/**
 * Item-item co-read recommendations. Candidate scores are weighted cosine
 * similarities to items already consumed by the target reader.
 */
export function coReadRecommend(
  matrix: InteractionMatrix,
  readerId: string,
  options: { limit?: number; candidateIds?: readonly string[] } = {},
): ItemRecommendation[] {
  const consumed = matrix[readerId] ?? {}
  const consumedIds = new Set(Object.keys(consumed).filter((id) => (consumed[id] ?? 0) > 0))
  if (consumedIds.size === 0) return []

  const vectors = itemVectors(matrix)
  const allowed = options.candidateIds ? new Set(options.candidateIds) : null
  const output: ItemRecommendation[] = []
  for (const [candidateId, candidateVector] of vectors) {
    if (consumedIds.has(candidateId) || (allowed && !allowed.has(candidateId))) continue
    let score = 0
    let supportingItems = 0
    for (const consumedId of consumedIds) {
      const source = vectors.get(consumedId)
      if (!source) continue
      const similarity = vectorCosine(source, candidateVector)
      if (similarity <= 0) continue
      score += similarity * (consumed[consumedId] ?? 0)
      supportingItems += 1
    }
    if (score > 0) output.push({ itemId: candidateId, score, supportingItems })
  }
  return output
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.supportingItems - a.supportingItems ||
        a.itemId.localeCompare(b.itemId),
    )
    .slice(0, Math.max(1, options.limit ?? 10))
}

export type VectorCandidate<T = unknown> = {
  id: string
  vector: SparseVector
  value?: T
}

/** Exact k-NN over sparse interest vectors; suitable only for small baselines. */
export function knnRecommend<T>(
  interest: SparseVector,
  candidates: readonly VectorCandidate<T>[],
  k = 10,
): Array<VectorCandidate<T> & { similarity: number }> {
  return candidates
    .map((candidate) => ({ ...candidate, similarity: vectorCosine(interest, candidate.vector) }))
    .filter((candidate) => candidate.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity || a.id.localeCompare(b.id))
    .slice(0, Math.max(1, k))
}
