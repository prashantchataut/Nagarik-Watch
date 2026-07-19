/**
 * Local "embeddings": deterministic hashing-trick term-frequency vectors.
 * No external model calls — an honest local approximation used wherever the
 * catalog calls for embedding similarity / semantic search without a vendor.
 */
import { tokenSet } from '../handlers/utils'

const VECTOR_DIMS = 64

function hashToken(token: string, dims: number): number {
  let h = 2166136261
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % dims
}

export function embed(text: string, dims = VECTOR_DIMS): number[] {
  const vector = new Array(dims).fill(0) as number[]
  for (const token of tokenSet(text)) {
    const idx = hashToken(token, dims)
    vector[idx] = (vector[idx] ?? 0) + 1
  }
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1
  return vector.map((v) => v / norm)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let dot = 0
  for (let i = 0; i < len; i++) dot += a[i]! * b[i]!
  return Math.max(-1, Math.min(1, dot))
}

export function textSimilarity(a: string, b: string): number {
  return cosineSimilarity(embed(a), embed(b))
}

export function nearestByEmbedding(
  query: string,
  candidates: { id: string; text: string }[],
  limit = 5,
): { id: string; score: number }[] {
  const q = embed(query)
  return candidates
    .map((c) => ({ id: c.id, score: cosineSimilarity(q, embed(c.text)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
