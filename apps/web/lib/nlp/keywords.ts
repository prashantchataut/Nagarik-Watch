const STOPWORDS = new Set([
  'छ',
  'र',
  'का',
  'की',
  'को',
  'मा',
  'the',
  'a',
  'an',
  'is',
  'of',
  'and',
  'to',
])

export type ExtractedKeyword = {
  term: string
  freq: number
}

/** Frequency-based keyword extraction over non-stopword terms, highest frequency first. */
export function extractKeywords(text: string, limit = 5): ExtractedKeyword[] {
  const words = text
    .toLowerCase()
    .split(/[\s\u0964\u0965,.!?;:()"']+/u)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
  const freq = new Map<string, number>()
  for (const word of words) freq.set(word, (freq.get(word) ?? 0) + 1)
  return [...freq.entries()]
    .map(([term, count]) => ({ term, freq: count }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, limit)
}
