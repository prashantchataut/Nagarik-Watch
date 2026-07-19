import type { StoryCardData } from '@nagarikwatch/db'
import { nearestByEmbedding } from './algorithms/product/local-embeddings'
import { CIVIC_QUERY_LEXICON, lexiconExpandTerm, type QueryLexicon } from './search-lexicon'

/**
 * Production search stack for the bounded news corpus:
 *   - inverted index (posting lists)
 *   - BM25 fielded ranking (title > author > deck > category)
 *   - fuzzy term recovery for Latin typos (edit distance ≤ 1–2)
 *   - editorial query expansion (Nepali↔English civic lexicon)
 *   - prefix trie autocomplete
 *
 * Devanagari has no case fold; Latin is lowercased + accent-stripped.
 * Pure and framework-agnostic for unit tests.
 */

/** Synonym / bilingual hits score below exact and fuzzy recoveries. */
const LEXICON_BOOST = 0.72

export type SearchableStory = Pick<
  StoryCardData,
  | 'id'
  | 'slug'
  | 'category'
  | 'categoryLabel'
  | 'titleNe'
  | 'titleEn'
  | 'deckNe'
  | 'deckEn'
  | 'byline'
  | 'publishedAt'
  | 'hasEnglish'
  | 'isBreaking'
> & { heroImage?: { url: string; alt: string } | null; authors: { name: string; slug: string }[] }

export type SearchResult = SearchableStory & { score: number }

export type SearchableDoc = {
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  categoryLabelNe: string
  categoryLabelEn: string
  authorNames: string[]
  publishedAt: string
  story: SearchableStory
}

type Field = 'title' | 'deck' | 'author' | 'category'

type FieldFreq = Record<Field, number>

type TrieNode = {
  children: Map<string, TrieNode>
  terminal: boolean
  phrases: string[]
}

export type SearchIndex = {
  docs: SearchableDoc[]
  /** term → docIndex → per-field term frequency */
  inverted: Map<string, Map<number, FieldFreq>>
  avgdl: Record<Field, number>
  docLen: Array<Record<Field, number>>
  vocabulary: string[]
  trie: TrieNode
  docCount: number
}

const FIELDS: Field[] = ['title', 'deck', 'author', 'category']
const FIELD_WEIGHT: Record<Field, number> = {
  title: 3.2,
  author: 1.6,
  deck: 1.3,
  category: 1.0,
}

/** BM25 parameters — standard news-search defaults. */
const K1 = 1.4
const B = 0.75

/** Normalize for matching: lowercase Latin, strip combining marks and Devanagari joiners. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u200c|\u200d/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function hasDevanagari(token: string): boolean {
  return /[\u0900-\u097F]/.test(token)
}

/**
 * Expand a surface token into index keys. Devanagari is agglutinative in news
 * copy (बजेटमा / बजेटको), so we index meaningful prefixes; Latin stays whole-token.
 */
function indexKeysForToken(token: string): string[] {
  if (!token) return []
  if (!hasDevanagari(token)) return [token]
  const keys = new Set<string>([token])
  const min = 2
  for (let len = min; len < token.length; len++) {
    keys.add(token.slice(0, len))
  }
  return [...keys]
}

function emptyFieldFreq(): FieldFreq {
  return { title: 0, deck: 0, author: 0, category: 0 }
}

function emptyTrie(): TrieNode {
  return { children: new Map(), terminal: false, phrases: [] }
}

function trieInsert(root: TrieNode, phrase: string) {
  const normalized = normalize(phrase)
  if (!normalized || normalized.length < 2) return
  let node = root
  for (const ch of normalized) {
    let next = node.children.get(ch)
    if (!next) {
      next = emptyTrie()
      node.children.set(ch, next)
    }
    node = next
    if (!node.phrases.includes(phrase)) {
      node.phrases.push(phrase)
      if (node.phrases.length > 12) node.phrases.length = 12
    }
  }
  node.terminal = true
}

function trieSuggest(root: TrieNode, prefix: string, limit = 8): string[] {
  const normalized = normalize(prefix)
  if (!normalized) return []
  let node = root
  for (const ch of normalized) {
    const next = node.children.get(ch)
    if (!next) return []
    node = next
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const phrase of node.phrases) {
    if (seen.has(phrase)) continue
    seen.add(phrase)
    out.push(phrase)
    if (out.length >= limit) break
  }
  return out
}

function isLatinToken(token: string): boolean {
  return /^[a-z0-9'-]+$/i.test(token)
}

/** Levenshtein distance capped for short tokens. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows = a.length + 1
  const cols = b.length + 1
  let prev: number[] = Array.from({ length: cols }, (_, j) => j)
  let curr: number[] = Array.from({ length: cols }, () => 0)
  for (let i = 1; i < rows; i++) {
    curr[0] = i
    let rowMin = i
    const aCh = a.charAt(i - 1)
    for (let j = 1; j < cols; j++) {
      const cost = aCh === b.charAt(j - 1) ? 0 : 1
      const del = (prev[j] ?? max + 1) + 1
      const ins = (curr[j - 1] ?? max + 1) + 1
      const sub = (prev[j - 1] ?? max + 1) + cost
      const value = Math.min(del, ins, sub)
      curr[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length] ?? max + 1
}

/** Resolve typos against the inverted-index vocabulary for Latin terms. */
export function fuzzyExpandTerm(term: string, vocabulary: string[], maxCandidates = 3): string[] {
  if (!term || !isLatinToken(term) || vocabulary.length === 0) return [term]
  if (vocabulary.includes(term)) return [term]

  const maxDist = term.length <= 4 ? 1 : 2
  const scored: Array<{ term: string; d: number }> = []
  for (const candidate of vocabulary) {
    if (!isLatinToken(candidate)) continue
    if (Math.abs(candidate.length - term.length) > maxDist) continue
    const d = editDistance(term, candidate, maxDist)
    if (d <= maxDist) scored.push({ term: candidate, d })
  }
  scored.sort((a, b) => a.d - b.d || a.term.localeCompare(b.term))
  const expanded = scored.slice(0, maxCandidates).map((s) => s.term)
  return expanded.length > 0 ? expanded : [term]
}

function idf(docFreq: number, docCount: number): number {
  // Lucene/BM25+ style IDF — never negative.
  return Math.log(1 + (docCount - docFreq + 0.5) / (docFreq + 0.5))
}

function bm25Field(
  tf: number,
  docLen: number,
  avgdl: number,
  docFreq: number,
  docCount: number,
): number {
  if (tf <= 0 || docCount <= 0) return 0
  const denom = tf + K1 * (1 - B + B * (docLen / Math.max(1, avgdl)))
  return idf(docFreq, docCount) * ((tf * (K1 + 1)) / Math.max(denom, 1e-9))
}

/** Build the searchable index from story cards, once per corpus load. */
export function buildIndex(stories: SearchableStory[]): SearchIndex {
  const docs: SearchableDoc[] = stories.map((s) => ({
    titleNe: s.titleNe ?? '',
    titleEn: s.titleEn ?? '',
    deckNe: s.deckNe ?? '',
    deckEn: s.deckEn ?? '',
    categoryLabelNe: s.category.nameNe,
    categoryLabelEn: s.category.nameEn,
    authorNames: s.authors.map((a) => a.name),
    publishedAt: s.publishedAt,
    story: s,
  }))

  const inverted = new Map<string, Map<number, FieldFreq>>()
  const docLen: Array<Record<Field, number>> = []
  const sumLen: Record<Field, number> = { title: 0, deck: 0, author: 0, category: 0 }
  const trie = emptyTrie()
  const vocabSet = new Set<string>()

  docs.forEach((doc, docIndex) => {
    const fieldText: Record<Field, string> = {
      title: `${doc.titleNe} ${doc.titleEn}`,
      deck: `${doc.deckNe} ${doc.deckEn}`,
      author: doc.authorNames.join(' '),
      category: `${doc.categoryLabelNe} ${doc.categoryLabelEn}`,
    }
    const lengths: Record<Field, number> = { title: 0, deck: 0, author: 0, category: 0 }

    for (const field of FIELDS) {
      const tokens = tokenize(fieldText[field])
      lengths[field] = tokens.length
      sumLen[field] += tokens.length
      const tf = new Map<string, number>()
      for (const token of tokens) {
        for (const key of indexKeysForToken(token)) {
          // Prefix keys inherit the surface-token hit so Devanagari stems match.
          tf.set(key, (tf.get(key) ?? 0) + 1)
          vocabSet.add(key)
        }
      }
      for (const [token, count] of tf) {
        let posting = inverted.get(token)
        if (!posting) {
          posting = new Map()
          inverted.set(token, posting)
        }
        const freqs = posting.get(docIndex) ?? emptyFieldFreq()
        freqs[field] += count
        posting.set(docIndex, freqs)
      }
    }

    docLen.push(lengths)

    trieInsert(trie, doc.titleNe)
    if (doc.titleEn) trieInsert(trie, doc.titleEn)
    trieInsert(trie, doc.categoryLabelNe)
    if (doc.categoryLabelEn) trieInsert(trie, doc.categoryLabelEn)
    for (const author of doc.authorNames) trieInsert(trie, author)
  })

  const n = Math.max(1, docs.length)
  return {
    docs,
    inverted,
    avgdl: {
      title: sumLen.title / n,
      deck: sumLen.deck / n,
      author: sumLen.author / n,
      category: sumLen.category / n,
    },
    docLen,
    vocabulary: [...vocabSet],
    trie,
    docCount: docs.length,
  }
}

function expandQueryTerm(
  term: string,
  vocabulary: string[],
  lexicon: QueryLexicon,
): Array<{ term: string; boost: number }> {
  const variants = new Map<string, number>()
  variants.set(term, 1)
  for (const fuzzy of fuzzyExpandTerm(term, vocabulary)) {
    if (!variants.has(fuzzy)) variants.set(fuzzy, fuzzy === term ? 1 : 0.85)
  }
  for (const synonym of lexiconExpandTerm(term, lexicon)) {
    const normalized = normalize(synonym)
    if (!normalized || variants.has(normalized)) continue
    variants.set(normalized, LEXICON_BOOST)
    for (const key of indexKeysForToken(normalized)) {
      if (!variants.has(key)) variants.set(key, LEXICON_BOOST * 0.95)
    }
  }
  return [...variants.entries()].map(([variant, boost]) => ({ term: variant, boost }))
}

/**
 * Query the inverted index with BM25. Multi-term queries are AND-ed at the
 * document level after fuzzy + lexicon expansion of each term.
 */
export function search(
  index: SearchIndex,
  rawQuery: string,
  limit = 24,
  lexicon: QueryLexicon = CIVIC_QUERY_LEXICON,
): SearchResult[] {
  const terms = normalize(rawQuery).split(' ').filter(Boolean)
  if (terms.length === 0 || index.docCount === 0) return []

  const expanded = terms.map((term) => expandQueryTerm(term, index.vocabulary, lexicon))
  const candidateScores = new Map<number, number>()

  for (let t = 0; t < expanded.length; t++) {
    const variants = expanded[t] ?? []
    const matchedDocs = new Map<number, number>()

    for (const variant of variants) {
      const posting = index.inverted.get(variant.term)
      if (!posting) continue
      const docFreq = posting.size
      for (const [docIndex, freqs] of posting) {
        let fieldScore = 0
        for (const field of FIELDS) {
          fieldScore +=
            FIELD_WEIGHT[field] *
            bm25Field(
              freqs[field],
              index.docLen[docIndex]?.[field] ?? 0,
              index.avgdl[field] || 1,
              docFreq,
              index.docCount,
            )
        }
        matchedDocs.set(
          docIndex,
          Math.max(matchedDocs.get(docIndex) ?? 0, fieldScore * variant.boost),
        )
      }
    }

    if (matchedDocs.size === 0) return []

    if (t === 0) {
      for (const [docIndex, score] of matchedDocs) candidateScores.set(docIndex, score)
    } else {
      for (const docIndex of [...candidateScores.keys()]) {
        const termScore = matchedDocs.get(docIndex)
        if (termScore === undefined) candidateScores.delete(docIndex)
        else candidateScores.set(docIndex, (candidateScores.get(docIndex) ?? 0) + termScore)
      }
    }
  }

  const scored: SearchResult[] = []
  for (const [docIndex, score] of candidateScores) {
    const doc = index.docs[docIndex]
    if (!doc) continue
    let total = score
    // Tiny recency tie-break — never dominates BM25 relevance.
    const published = Date.parse(doc.publishedAt)
    if (Number.isFinite(published)) {
      const ageDays = Math.max(0, (Date.now() - published) / 86_400_000)
      total += Math.max(0, 1.5 - ageDays / 60)
    }
    scored.push({ ...doc.story, score: total })
  }

  scored.sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))

  if (process.env.SEARCH_SEMANTIC_LOCAL === '1' && rawQuery.trim()) {
    return blendLocalSemantic(index, rawQuery, scored, limit)
  }
  return scored.slice(0, limit)
}

/** Optional local term-vector blend — never replaces BM25 as primary. */
function blendLocalSemantic(
  index: SearchIndex,
  rawQuery: string,
  bm25Hits: SearchResult[],
  limit: number,
): SearchResult[] {
  const candidates = index.docs.map((doc) => ({
    id: doc.story.id,
    text: `${doc.titleNe} ${doc.titleEn} ${doc.deckNe} ${doc.deckEn}`,
  }))
  const semantic = nearestByEmbedding(rawQuery, candidates, Math.max(limit, 12))
  const byId = new Map(bm25Hits.map((hit) => [hit.id, hit]))
  const maxBm25 = bm25Hits[0]?.score ?? 1
  for (const item of semantic) {
    const story = index.docs.find((doc) => doc.story.id === item.id)?.story
    if (!story) continue
    const existing = byId.get(item.id)
    const semanticBoost = Math.max(0, item.score) * maxBm25 * 0.35
    if (existing) {
      byId.set(item.id, { ...existing, score: existing.score + semanticBoost })
    } else {
      byId.set(item.id, { ...story, score: semanticBoost })
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
}

/** Prefix autocomplete from the title/author/category trie. */
export function autocomplete(index: SearchIndex, rawPrefix: string, limit = 8): string[] {
  return trieSuggest(index.trie, rawPrefix, limit)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** View-layer highlight: split a display string into alternating plain/matched segments. */
export function highlightSegments(
  display: string,
  query: string,
): { text: string; match: boolean }[] {
  const terms = normalize(query)
    .split(' ')
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (terms.length === 0) return [{ text: display, match: false }]

  const lower = display.toLowerCase()
  const ranges: [number, number][] = []
  for (const term of terms) {
    const re = new RegExp(escapeRegex(term), 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(lower)) !== null) {
      ranges.push([m.index, m.index + m[0].length])
      if (m[0] === '') re.lastIndex++
    }
  }
  if (ranges.length === 0) return [{ text: display, match: false }]
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([r[0], r[1]])
  }

  const out: { text: string; match: boolean }[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) out.push({ text: display.slice(cursor, start), match: false })
    out.push({ text: display.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < display.length) out.push({ text: display.slice(cursor), match: false })
  return out
}
