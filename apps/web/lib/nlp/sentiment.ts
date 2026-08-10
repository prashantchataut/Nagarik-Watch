import { tokenSet } from './tokenize'

/**
 * Bilingual sentiment lexicon. Useful as a moderation-assist signal, never a
 * publish gate (PRODUCT.md). Extend both lists together to keep polarity
 * balanced.
 */
export const POSITIVE_WORDS = [
  'सराहनीय',
  'good',
  'great',
  'प्रभावकारी',
  'सफल',
  'success',
  'राहत',
  'welcome',
]
export const NEGATIVE_WORDS = [
  'नराम्रो',
  'bad',
  'failure',
  'असफल',
  'क्षति',
  'damage',
  'खराब',
  'crisis',
]

export type SentimentResult = {
  polarity: number
  positive: number
  negative: number
}

/** Lexicon sentiment: polarity is (positive-negative)/total, 0 when nothing matches. */
export function sentimentOf(text: string): SentimentResult {
  const tokens = tokenSet(text)
  let positive = 0
  let negative = 0
  for (const word of POSITIVE_WORDS) if (tokens.has(word.toLowerCase())) positive += 1
  for (const word of NEGATIVE_WORDS) if (tokens.has(word.toLowerCase())) negative += 1
  const total = positive + negative
  const polarity = total === 0 ? 0 : (positive - negative) / total
  return { polarity, positive, negative }
}

/** Assist-friendly alias used by journalist AI and tests. */
export function analyzeSentiment(text: string): SentimentResult & {
  score: number
  label: 'positive' | 'neutral' | 'negative'
  positiveHits: number
  negativeHits: number
} {
  const result = sentimentOf(text)
  const label = result.polarity > 0.2 ? 'positive' : result.polarity < -0.2 ? 'negative' : 'neutral'
  return {
    ...result,
    score: result.polarity,
    label,
    positiveHits: result.positive,
    negativeHits: result.negative,
  }
}
