import { describe, expect, it } from 'vitest'
import { isDatabaseInfrastructureError } from './pg-errors'

describe('isDatabaseInfrastructureError', () => {
  it('detects Postgres capacity and connect timeouts', () => {
    expect(
      isDatabaseInfrastructureError(
        Object.assign(new Error('remaining connection slots are reserved'), { code: '53300' }),
      ),
    ).toBe(true)
    expect(isDatabaseInfrastructureError(new Error('timeout exceeded when trying to connect'))).toBe(
      true,
    )
    expect(
      isDatabaseInfrastructureError(
        new Error('boot failed', {
          cause: Object.assign(new Error('pool saturated'), { code: '53300' }),
        }),
      ),
    ).toBe(true)
  })

  it('ignores ordinary application errors', () => {
    expect(isDatabaseInfrastructureError(new Error('INVALID_PASSWORD'))).toBe(false)
    expect(isDatabaseInfrastructureError(null)).toBe(false)
  })
})
