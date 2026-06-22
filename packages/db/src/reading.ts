import type { Locale } from './types'

export type ReadingMetrics = {
  wordCount: number
  characterCount: number
  readingMinutes: number
  readingHoursLabel?: string
}

const READING_WORDS_PER_MINUTE: Record<Locale | 'hi', number> = {
  ne: 180,
  en: 220,
  hi: 190,
}

function tokensFor(text: string): string[] {
  return text
    .trim()
    .split(/[\s\u0964\u0965,.;:!?()\[\]{}"'“”‘’]+/u)
    .filter(Boolean)
}

export function estimateReadingMetrics(text: string, locale: Locale | 'hi' = 'ne'): ReadingMetrics {
  const tokens = tokensFor(text)
  const characterCount = text.replace(/\s+/gu, '').length
  const wordsPerMinute = READING_WORDS_PER_MINUTE[locale]
  const readingMinutes = Math.max(1, Math.ceil(tokens.length / wordsPerMinute))
  const readingHoursLabel =
    readingMinutes >= 90 ? `about ${Math.round(readingMinutes / 60)} hours` : undefined

  return {
    wordCount: tokens.length,
    characterCount,
    readingMinutes,
    readingHoursLabel,
  }
}

export function remainingReadingMinutes(totalMinutes: number, progressPercent: number): number {
  const boundedProgress = Math.min(100, Math.max(0, progressPercent))
  const remainingRatio = (100 - boundedProgress) / 100
  return Math.max(0, Math.ceil(totalMinutes * remainingRatio))
}
