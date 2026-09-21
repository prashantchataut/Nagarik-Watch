/**
 * Distributional term vectors learned from the corpus itself.
 *
 * The catalog has carried "semantic search" and "embedding similarity" for a
 * long time, backed by hashed term-frequency vectors. Those are not semantics:
 * hashing `मस्को` and `पुटिन` gives two unrelated buckets, so the "nearest"
 * document was always one that already shared the reader's words — which is
 * what the inverted index does, better. The result was a layer that could only
 * agree with BM25 or add noise.
 *
 * This is the smallest thing that genuinely finds a document sharing no word
 * with the query: count which terms occur together inside a story, weight the
 * counts by PPMI so that common words stop dominating, and compare terms by
 * the cosine of those context vectors. `मस्को` and `पुटिन` end up neighbours
 * because stories about one mention the other — knowledge that exists in the
 * archive rather than in a vendor's model.
 *
 * It is a bounded, in-process computation over an already-bounded corpus: one
 * pass to count, then neighbour lookups on demand, memoized per index.
 */

export type TermVectors = {
  /** term → context term → co-occurrence count */
  contexts: Map<string, Map<string, number>>
  /** term → number of documents containing it */
  df: Map<string, number>
  docCount: number
  /** Lazily-filled neighbour cache; see {@link termNeighbors}. */
  cache: Map<string, Neighbor[]>
  /** PPMI vectors, built on first use. */
  weighted: Map<string, Map<string, number>> | null
  /** context term → terms whose vector mentions it, for candidate lookup */
  postings: Map<string, Set<string>> | null
}

export type Neighbor = { term: string; score: number }

/** A term seen in only one story has no distribution worth trusting. */
const MIN_DOC_FREQUENCY = 2
/** Terms in more than this share of the corpus carry no topical signal. */
const MAX_DOC_RATIO = 0.5
/** Below this cosine, "related" is indistinguishable from coincidence. */
export const NEIGHBOR_FLOOR = 0.3

export function buildTermVectors(documents: Iterable<Iterable<string>>): TermVectors {
  const contexts = new Map<string, Map<string, number>>()
  const df = new Map<string, number>()
  let docCount = 0

  for (const document of documents) {
    const terms = [...new Set(document)]
    docCount += 1
    for (const term of terms) df.set(term, (df.get(term) ?? 0) + 1)
    // Co-occurrence is within a story, which for headlines and decks is a tight
    // enough window to mean "about the same thing".
    for (const term of terms) {
      let row = contexts.get(term)
      if (!row) {
        row = new Map()
        contexts.set(term, row)
      }
      for (const other of terms) {
        if (other === term) continue
        row.set(other, (row.get(other) ?? 0) + 1)
      }
    }
  }

  return { contexts, df, docCount, cache: new Map(), weighted: null, postings: null }
}

function informative(vectors: TermVectors, term: string): boolean {
  const frequency = vectors.df.get(term) ?? 0
  if (frequency < MIN_DOC_FREQUENCY) return false
  return frequency <= Math.max(MIN_DOC_FREQUENCY, vectors.docCount * MAX_DOC_RATIO)
}

/**
 * PPMI: log( p(a,b) / (p(a)p(b)) ), clipped at zero.
 *
 * Raw counts would make every term's nearest neighbour the corpus's most
 * common word. PPMI asks instead how much *more* often two terms appear
 * together than chance would explain, which is the part that carries meaning.
 */
function weightedVectors(vectors: TermVectors): Map<string, Map<string, number>> {
  if (vectors.weighted) return vectors.weighted
  const weighted = new Map<string, Map<string, number>>()
  const postings = new Map<string, Set<string>>()
  const total = vectors.docCount || 1

  for (const [term, row] of vectors.contexts) {
    if (!informative(vectors, term)) continue
    const pTerm = (vectors.df.get(term) ?? 0) / total
    const vector = new Map<string, number>()
    let norm = 0
    for (const [other, count] of row) {
      if (!informative(vectors, other)) continue
      const pOther = (vectors.df.get(other) ?? 0) / total
      const joint = count / total
      const ppmi = Math.log(joint / Math.max(1e-9, pTerm * pOther))
      if (ppmi <= 0) continue
      vector.set(other, ppmi)
      norm += ppmi * ppmi
    }
    if (vector.size === 0) continue
    const length = Math.sqrt(norm) || 1
    for (const [other, value] of vector) {
      vector.set(other, value / length)
      let posting = postings.get(other)
      if (!posting) {
        posting = new Set()
        postings.set(other, posting)
      }
      posting.add(term)
    }
    weighted.set(term, vector)
  }

  vectors.weighted = weighted
  vectors.postings = postings
  return weighted
}

/**
 * Terms whose corpus distribution looks like this one's.
 *
 * Candidates come from the shared-context postings rather than the whole
 * vocabulary, so the cost tracks how connected the term is, not how large the
 * archive has grown.
 */
export function termNeighbors(
  vectors: TermVectors,
  term: string,
  limit = 2,
  floor = NEIGHBOR_FLOOR,
): Neighbor[] {
  const cached = vectors.cache.get(term)
  if (cached) return cached.filter((hit) => hit.score >= floor).slice(0, limit)

  const weighted = weightedVectors(vectors)
  const self = weighted.get(term)
  if (!self) {
    vectors.cache.set(term, [])
    return []
  }

  const candidates = new Set<string>()
  for (const context of self.keys()) {
    for (const candidate of vectors.postings?.get(context) ?? []) {
      if (candidate !== term) candidates.add(candidate)
    }
  }

  const scored: Neighbor[] = []
  for (const candidate of candidates) {
    const other = weighted.get(candidate)
    if (!other) continue
    // Iterate the shorter vector; both are unit length, so the dot product is
    // already the cosine.
    const [small, large] = self.size <= other.size ? [self, other] : [other, self]
    let dot = 0
    for (const [context, value] of small) dot += value * (large.get(context) ?? 0)
    if (dot <= 0) continue
    scored.push({ term: candidate, score: dot })
  }

  scored.sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
  const top = scored.slice(0, Math.max(limit, 8))
  vectors.cache.set(term, top)
  return top.filter((hit) => hit.score >= floor).slice(0, limit)
}
