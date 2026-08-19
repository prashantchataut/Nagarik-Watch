import { describe, expect, it } from 'vitest'
import { shouldApplyLivePathDdl } from './ops-db'

describe('operational schema bootstrap', () => {
  it('skips live-path DDL in production (migrations must be pre-applied)', () => {
    const previous = process.env.NODE_ENV
    const previousPhase = process.env.NEXT_PHASE
    const previousE2e = process.env.E2E_TEST
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PHASE
    delete process.env.E2E_TEST
    delete process.env.E2E_NEWSROOM
    expect(shouldApplyLivePathDdl()).toBe(false)
    process.env.NODE_ENV = previous
    if (previousPhase === undefined) delete process.env.NEXT_PHASE
    else process.env.NEXT_PHASE = previousPhase
    if (previousE2e === undefined) delete process.env.E2E_TEST
    else process.env.E2E_TEST = previousE2e
  })

  it('allows development bootstrap DDL', () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    expect(shouldApplyLivePathDdl()).toBe(true)
    process.env.NODE_ENV = previous
  })
})
