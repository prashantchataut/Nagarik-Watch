import { describe, expect, it } from 'vitest'
import { scoreCredentialStuffing, type StuffingWindow } from './credential-stuffing'

function window(overrides: Partial<StuffingWindow> = {}): StuffingWindow {
  return {
    windowMinutes: 15,
    originFailures: 0,
    originAttempts: 0,
    originIdentifiers: 0,
    identifierFailures: 0,
    identifierOrigins: 0,
    ...overrides,
  }
}

describe('scoreCredentialStuffing', () => {
  it('leaves a journalist mistyping their own password alone', () => {
    const signal = scoreCredentialStuffing(
      window({
        originFailures: 3,
        originAttempts: 4,
        originIdentifiers: 1,
        identifierFailures: 3,
        identifierOrigins: 1,
      }),
    )
    expect(signal.verdict).toBe('clear')
    expect(signal.reasons).toEqual([])
  })

  it('catches a spray that never trips a per-key rate limit', () => {
    // Two attempts each against forty accounts: every individual key is well
    // under any sane limit, and the campaign is obvious.
    const signal = scoreCredentialStuffing(
      window({
        originFailures: 80,
        originAttempts: 80,
        originIdentifiers: 40,
        identifierFailures: 2,
        identifierOrigins: 1,
      }),
    )
    expect(signal.verdict).toBe('block')
    expect(signal.reasons).toContain('account-spray')
    expect(signal.reasons).toContain('all-failures')
  })

  it('catches one editor account being worked from a botnet', () => {
    const signal = scoreCredentialStuffing(
      window({
        originFailures: 2,
        originAttempts: 2,
        originIdentifiers: 1,
        identifierFailures: 60,
        identifierOrigins: 30,
      }),
    )
    expect(signal.reasons).toContain('distributed-origins')
    expect(signal.reasons).toContain('failure-volume')
    expect(signal.verdict === 'challenge' || signal.verdict === 'block').toBe(true)
  })

  it('escalates as a spray widens rather than saturating at the threshold', () => {
    const at = (identifiers: number) =>
      scoreCredentialStuffing(
        window({
          originIdentifiers: identifiers,
          originFailures: identifiers * 2,
          originAttempts: identifiers * 2,
        }),
      ).score
    expect(at(5)).toBeGreaterThan(at(2))
    expect(at(40)).toBeGreaterThan(at(5))
    expect(at(200)).toBeGreaterThan(at(40))
  })

  it('ignores the failure ratio until there are enough attempts to have one', () => {
    const signal = scoreCredentialStuffing(
      window({ originFailures: 2, originAttempts: 2, originIdentifiers: 1 }),
    )
    expect(signal.reasons).not.toContain('all-failures')
    expect(signal.verdict).toBe('clear')
    expect(signal.score).toBeLessThan(0.05)
  })

  it('flags machine-speed attempts separately from volume', () => {
    const signal = scoreCredentialStuffing(
      window({
        windowMinutes: 1,
        originFailures: 30,
        originAttempts: 30,
        originIdentifiers: 2,
        identifierFailures: 15,
        identifierOrigins: 1,
      }),
    )
    expect(signal.reasons).toContain('superhuman-velocity')
  })

  it('does not flag velocity on a quiet desk with one slow login', () => {
    const signal = scoreCredentialStuffing(
      window({ windowMinutes: 1, originFailures: 1, originAttempts: 2, originIdentifiers: 1 }),
    )
    expect(signal.reasons).not.toContain('superhuman-velocity')
  })

  it('is monotonic: an empty window never outranks a busy one', () => {
    expect(scoreCredentialStuffing(window()).score).toBe(0)
    expect(scoreCredentialStuffing(window()).verdict).toBe('clear')
  })
})
