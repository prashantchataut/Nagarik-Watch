import { describe, expect, it } from 'vitest'
import { cronGreenWindowHours } from './cron-window'

describe('cronGreenWindowHours', () => {
  it('returns 0 when there are no runs', () => {
    expect(cronGreenWindowHours([], 10)).toBe(0)
  })

  it('measures a continuous 48-hour window of 10-minute jobs', () => {
    const now = new Date('2026-08-14T12:00:00.000Z')
    const runs: string[] = []
    for (let minutes = 0; minutes <= 48 * 60; minutes += 10) {
      runs.push(new Date(now.getTime() - minutes * 60_000).toISOString())
    }
    expect(cronGreenWindowHours(runs, 10, now)).toBeGreaterThanOrEqual(47.9)
  })

  it('breaks the streak on a gap larger than 1.5× interval', () => {
    const now = new Date('2026-08-14T12:00:00.000Z')
    const runs = [
      now.toISOString(),
      new Date(now.getTime() - 10 * 60_000).toISOString(),
      new Date(now.getTime() - 3 * 60 * 60_000).toISOString(),
    ]
    expect(cronGreenWindowHours(runs, 10, now)).toBeLessThan(1)
  })
})
