import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldApplyLivePathDdl } from './ops-db'

describe('operational schema bootstrap', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips live-path DDL in production (migrations must be pre-applied)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PHASE', '')
    vi.stubEnv('E2E_TEST', '')
    vi.stubEnv('E2E_NEWSROOM', '')
    expect(shouldApplyLivePathDdl()).toBe(false)
  })

  it('allows development bootstrap DDL', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(shouldApplyLivePathDdl()).toBe(true)
  })
})
