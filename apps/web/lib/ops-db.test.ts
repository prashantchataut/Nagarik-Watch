import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldApplyLivePathDdl } from './ops-db'

// `process.env.NODE_ENV` is readonly to TypeScript, and hand-rolled
// save/restore leaks into sibling tests when an assertion throws.
// `vi.stubEnv` types cleanly and unwinds in afterEach either way.
describe('operational schema bootstrap', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips live-path DDL in production (migrations must be pre-applied)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PHASE', undefined)
    vi.stubEnv('E2E_TEST', undefined)
    vi.stubEnv('E2E_NEWSROOM', undefined)
    expect(shouldApplyLivePathDdl()).toBe(false)
  })

  it('allows development bootstrap DDL', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(shouldApplyLivePathDdl()).toBe(true)
  })
})
