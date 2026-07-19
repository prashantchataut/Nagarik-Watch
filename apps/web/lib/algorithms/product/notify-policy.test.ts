import { describe, expect, it } from 'vitest'
import {
  batchPressure,
  bestSendHour,
  cooldownRemainingMinutes,
  fatigueHeadroom,
  isQuietHour,
  sendTimeScore,
} from './notify-policy'

describe('isQuietHour', () => {
  it('treats an overnight window (22 -> 6) as wrapping past midnight', () => {
    expect(isQuietHour(23)).toBe(true)
    expect(isQuietHour(2)).toBe(true)
    expect(isQuietHour(12)).toBe(false)
  })

  it('handles a same-day window without wrapping', () => {
    expect(isQuietHour(9, 8, 17)).toBe(true)
    expect(isQuietHour(20, 8, 17)).toBe(false)
  })

  it('never suppresses when start equals end (quiet hours disabled)', () => {
    expect(isQuietHour(3, 5, 5)).toBe(false)
  })

  it('normalizes out-of-range hours', () => {
    expect(isQuietHour(26)).toBe(isQuietHour(2))
    expect(isQuietHour(-1)).toBe(isQuietHour(23))
  })
})

describe('batchPressure', () => {
  it('is zero with no pending sends', () => {
    expect(batchPressure(0, 30)).toBe(0)
  })

  it('scales toward 1 as pending sends approach the window capacity', () => {
    expect(batchPressure(6, 30)).toBeCloseTo(1, 5)
    expect(batchPressure(3, 30)).toBeCloseTo(0.5, 5)
  })

  it('clamps above capacity to 1', () => {
    expect(batchPressure(500, 30)).toBe(1)
  })

  it('treats a non-positive window as immediate saturation when anything is pending', () => {
    expect(batchPressure(1, 0)).toBe(1)
    expect(batchPressure(0, 0)).toBe(0)
  })
})

describe('cooldownRemainingMinutes', () => {
  it('returns the remaining minutes until cooldown clears', () => {
    expect(cooldownRemainingMinutes(5, 15)).toBe(10)
  })

  it('never returns a negative remainder once cooldown has passed', () => {
    expect(cooldownRemainingMinutes(20, 15)).toBe(0)
  })
})

describe('fatigueHeadroom', () => {
  it('is full headroom with zero sends today', () => {
    expect(fatigueHeadroom(0, 8)).toBe(1)
  })

  it('shrinks linearly as sends approach the daily cap', () => {
    expect(fatigueHeadroom(4, 8)).toBeCloseTo(0.5, 5)
  })

  it('floors at zero once the cap is reached or exceeded', () => {
    expect(fatigueHeadroom(10, 8)).toBe(0)
  })
})

describe('sendTimeScore / bestSendHour', () => {
  const engagementByHour = Array.from({ length: 24 }, (_, h) => (h === 19 ? 100 : h))

  it('falls back to a neutral score when the engagement curve is malformed', () => {
    expect(sendTimeScore(9, [])).toBe(0.5)
  })

  it('scores the peak hour at 1 and off-peak hours lower', () => {
    expect(sendTimeScore(19, engagementByHour)).toBe(1)
    expect(sendTimeScore(3, engagementByHour)).toBeLessThan(sendTimeScore(19, engagementByHour))
  })

  it('picks the highest-engagement hour as the best send hour', () => {
    expect(bestSendHour(engagementByHour)).toBe(19)
  })

  it('defaults to 9am when given a malformed curve', () => {
    expect(bestSendHour([1, 2, 3])).toBe(9)
  })
})
