import type { ArticleBlock } from '@nagarikwatch/db'

export type ReadingStats = {
  words: number
  minutes: number
  longRead: boolean
  labelEn: string
  labelNe: string
}

const NEPALI_WORDS_PER_MINUTE = 170
const ENGLISH_WORDS_PER_MINUTE = 220

function textFromBlock(block: ArticleBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading2':
    case 'heading3':
      return block.text
    case 'pullQuote':
      return [block.quoteNe, block.quoteEn, block.attribution].filter(Boolean).join(' ')
    case 'list':
      return block.items.join(' ')
    case 'image':
    case 'embed':
    case 'adSlot':
      return ''
  }
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/[\s\u0964\u0965,.!?;:()"']+/u)
    .filter(Boolean).length
}

export function estimateReadingStats(
  blocks: ArticleBlock[],
  locale: 'ne' | 'en' = 'ne',
): ReadingStats {
  const words = countWords(blocks.map(textFromBlock).join(' '))
  const speed = locale === 'en' ? ENGLISH_WORDS_PER_MINUTE : NEPALI_WORDS_PER_MINUTE
  const minutes = Math.max(1, Math.ceil(words / speed))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const labelEn =
    minutes >= 60
      ? `${hours} hr${hours > 1 ? 's' : ''}${remainingMinutes ? ` ${remainingMinutes} min` : ''} read`
      : `${minutes} min read`
  const labelNe =
    minutes >= 60 ? `${hours} घण्टा ${remainingMinutes} मिनेट पढाइ` : `${minutes} मिनेट पढाइ`

  return {
    words,
    minutes,
    longRead: minutes >= 20,
    labelEn,
    labelNe,
  }
}

export function remainingReadingMinutes(totalMinutes: number, scrollDepth: number): number {
  const clampedDepth = Math.min(100, Math.max(0, scrollDepth))
  return Math.max(0, Math.ceil(totalMinutes * (1 - clampedDepth / 100)))
}
