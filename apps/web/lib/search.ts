import type { StoryCardData } from '@nagarikwatch/db'

/**
 * Client-side story search. No dependency: the corpus is small (the seed), Devanagari has no
 * case to fold, and a focused scorer beats pulling in Fuse for this size. Multi-term queries
 * are AND-ed across the matched fields; ranking rewards title hits over deck/author hits and
 * rewards word-start matches over mid-word substrings, which is what readers expect from a
 * news search box. Pure and framework-agnostic so it can be unit-tested in isolation.
 */

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

/** Build the searchable document set from story cards, once per corpus load. */
export function buildIndex(stories: SearchableStory[]): SearchableDoc[] {
  return stories.map((s) => ({
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
}

/** Normalize for matching: lowercase Latin, strip combining marks and Devanagari joiners.
 *  Devanagari needs no case fold; NFD decomposition lets diacritics on Latin ignore accents. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u200c|\u200d/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Word-start hit count: a term beginning at a word boundary ranks higher than mid-word. */
function countWordStartHits(haystack: string, needle: string): number {
  if (!needle) return 0
  const re = new RegExp(`(^|\\s|\\u0964|\\u0965)${escapeRegex(needle)}`, 'g')
  let count = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(haystack)) !== null) {
    count += 1
    re.lastIndex = m.index + m[0].length
  }
  return count
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let from = 0
  let idx = haystack.indexOf(needle, from)
  while (idx !== -1) {
    count += 1
    from = idx + needle.length
    idx = haystack.indexOf(needle, from)
  }
  return count
}

const WEIGHTS = { title: 100, titleWordStart: 60, deck: 30, author: 40, category: 20 } as const

/** Score a single doc against one normalized term; returns 0 if the term matches nowhere. */
function scoreDoc(doc: SearchableDoc, term: string): number {
  if (!term) return 0
  const titleN = normalize(`${doc.titleNe} ${doc.titleEn}`)
  const deckN = normalize(`${doc.deckNe} ${doc.deckEn}`)
  const authorN = normalize(doc.authorNames.join(' '))
  const catN = normalize(`${doc.categoryLabelNe} ${doc.categoryLabelEn}`)

  const titleHits = countOccurrences(titleN, term)
  const deckHits = countOccurrences(deckN, term)
  const authorHits = countOccurrences(authorN, term)
  const catHits = countOccurrences(catN, term)
  const matched = titleHits + deckHits + authorHits + catHits > 0
  if (!matched) return 0

  let score = titleHits * WEIGHTS.title
  score += countWordStartHits(titleN, term) * WEIGHTS.titleWordStart
  score += deckHits * WEIGHTS.deck
  score += authorHits * WEIGHTS.author
  score += catHits * WEIGHTS.category
  return score
}

export function search(index: SearchableDoc[], rawQuery: string, limit = 24): SearchResult[] {
  const terms = normalize(rawQuery).split(' ').filter(Boolean)
  if (terms.length === 0) return []

  const scored: SearchResult[] = []
  for (const doc of index) {
    let total = 0
    let allMatched = true
    for (const term of terms) {
      const s = scoreDoc(doc, term)
      if (s === 0) {
        allMatched = false
        break
      }
      total += s
    }
    if (!allMatched) continue
    if (Date.parse(doc.publishedAt) > 0) total += 1
    scored.push({ ...doc.story, score: total })
  }

  scored.sort((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))
  return scored.slice(0, limit)
}

/** View-layer highlight: split a display string into alternating plain/matched segments by the
 *  query, lowercased and accent-folded so it tracks the same normalization as the scorer. */
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
