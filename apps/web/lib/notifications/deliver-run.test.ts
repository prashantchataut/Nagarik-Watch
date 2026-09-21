import { describe, expect, it } from 'vitest'
import { newsroomHour } from './deliver-run'
import { isQuietHour } from '@/lib/algorithms/product/notify-policy'

describe('newsroomHour', () => {
  it('reads the hour in Kathmandu, not on the UTC server clock', () => {
    // 18:30 UTC is 00:15 the next day in Kathmandu (UTC+5:45).
    const at = new Date('2026-03-01T18:30:00Z')
    expect(at.getUTCHours()).toBe(18)
    expect(newsroomHour(at)).toBe(0)
  })

  it('classifies the Nepali morning peak as awake, which the UTC hour did not', () => {
    // 02:00 UTC = 07:45 NPT. The old `new Date().getHours()` read 2 and the
    // 22:00-06:00 window suppressed the entire morning batch.
    const morning = new Date('2026-03-01T02:00:00Z')
    expect(isQuietHour(morning.getUTCHours())).toBe(true)
    expect(isQuietHour(newsroomHour(morning))).toBe(false)
  })

  it('classifies the Kathmandu night as quiet', () => {
    // 19:00 UTC = 00:45 NPT.
    expect(isQuietHour(newsroomHour(new Date('2026-03-01T19:00:00Z')))).toBe(true)
  })

  it('falls back to the UTC hour when the timezone is unknown to the runtime', () => {
    const at = new Date('2026-03-01T09:00:00Z')
    expect(newsroomHour(at, 'Not/AZone')).toBe(9)
  })
})
