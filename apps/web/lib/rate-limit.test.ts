import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rateLimit } from './rate-limit'

// No DATABASE_URL is configured in the test environment, so rateLimit() runs
// its in-memory token-bucket path — the same math the Postgres path applies.

describe('rateLimit (token bucket)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows up to `max` requests immediately, then denies', async () => {
    const opts = { prefix: 'test-burst', id: 'a', max: 3, windowMs: 1000 }
    expect((await rateLimit(opts)).ok).toBe(true)
    expect((await rateLimit(opts)).ok).toBe(true)
    expect((await rateLimit(opts)).ok).toBe(true)
    const fourth = await rateLimit(opts)
    expect(fourth.ok).toBe(false)
    expect(fourth.remaining).toBe(0)
  })

  it('refills continuously rather than resetting all at once at a window boundary', async () => {
    const opts = { prefix: 'test-refill', id: 'b', max: 2, windowMs: 1000 }
    await rateLimit(opts)
    await rateLimit(opts)
    expect((await rateLimit(opts)).ok).toBe(false)

    // Half the window has passed: refill rate is 2 tokens/1000ms, so ~1 token back.
    vi.setSystemTime(500)
    const partiallyRefilled = await rateLimit(opts)
    expect(partiallyRefilled.ok).toBe(true)

    // Immediately retrying without further elapsed time should fail again.
    const immediateRetry = await rateLimit(opts)
    expect(immediateRetry.ok).toBe(false)
  })

  it('keeps separate buckets per id', async () => {
    const base = { prefix: 'test-isolated', max: 1, windowMs: 1000 }
    expect((await rateLimit({ ...base, id: 'x' })).ok).toBe(true)
    expect((await rateLimit({ ...base, id: 'y' })).ok).toBe(true)
    expect((await rateLimit({ ...base, id: 'x' })).ok).toBe(false)
  })
})
