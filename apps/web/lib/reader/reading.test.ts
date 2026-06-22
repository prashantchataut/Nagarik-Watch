import { describe, expect, it } from 'vitest'
import { estimateReadingStats, remainingReadingMinutes } from './reading'

describe('reading stats', () => {
  it('estimates at least one minute for short articles', () => {
    const stats = estimateReadingStats([{ type: 'paragraph', text: 'छोटो खबर' }])
    expect(stats.minutes).toBe(1)
    expect(stats.longRead).toBe(false)
  })

  it('labels long reads when reading time crosses threshold', () => {
    const words = Array.from({ length: 3600 }, (_, index) => `शब्द${index}`).join(' ')
    const stats = estimateReadingStats([{ type: 'paragraph', text: words }])
    expect(stats.minutes).toBeGreaterThanOrEqual(20)
    expect(stats.longRead).toBe(true)
  })

  it('computes remaining minutes from scroll depth', () => {
    expect(remainingReadingMinutes(10, 0)).toBe(10)
    expect(remainingReadingMinutes(10, 55)).toBe(5)
    expect(remainingReadingMinutes(10, 100)).toBe(0)
  })
})
