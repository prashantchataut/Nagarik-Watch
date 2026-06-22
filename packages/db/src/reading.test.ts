import { describe, expect, it } from 'vitest'
import { estimateReadingMetrics, remainingReadingMinutes } from './reading'

describe('estimateReadingMetrics', () => {
  it('counts Devanagari tokens and returns at least one minute', () => {
    const result = estimateReadingMetrics('यो परीक्षण समाचार हो। नागरिक वाच पढ्दै हुनुहुन्छ।', 'ne')

    expect(result.wordCount).toBe(8)
    expect(result.characterCount).toBeGreaterThan(result.wordCount)
    expect(result.readingMinutes).toBe(1)
  })

  it('uses language-specific reading rates', () => {
    const text = Array.from({ length: 220 }, (_, index) => `word${index}`).join(' ')

    expect(estimateReadingMetrics(text, 'en').readingMinutes).toBe(1)
    expect(estimateReadingMetrics(text, 'ne').readingMinutes).toBe(2)
  })

  it('labels long reads in approximate hours', () => {
    const text = Array.from({ length: 11_000 }, (_, index) => `शब्द${index}`).join(' ')

    expect(estimateReadingMetrics(text, 'ne').readingHoursLabel).toBeUndefined()
    expect(estimateReadingMetrics(`${text} ${text}`, 'ne').readingHoursLabel).toBe('about 2 hours')
  })
})

describe('remainingReadingMinutes', () => {
  it('bounds progress and rounds remaining time accessibly', () => {
    expect(remainingReadingMinutes(10, 0)).toBe(10)
    expect(remainingReadingMinutes(10, 33)).toBe(7)
    expect(remainingReadingMinutes(10, 100)).toBe(0)
    expect(remainingReadingMinutes(10, 140)).toBe(0)
  })
})
