import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'
import { isCronAuthorized } from './cron-auth'

function requestWithAuth(header: string | null): NextRequest {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'authorization' ? header : null),
    },
  } as NextRequest
}

describe('isCronAuthorized', () => {
  it('rejects missing or short secrets', () => {
    const previous = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    expect(isCronAuthorized(requestWithAuth('Bearer anything'))).toBe(false)
    process.env.CRON_SECRET = 'too-short'
    expect(isCronAuthorized(requestWithAuth('Bearer too-short'))).toBe(false)
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  })

  it('accepts a matching Bearer token when the secret is long enough', () => {
    const previous = process.env.CRON_SECRET
    process.env.CRON_SECRET = 'cron-secret-with-enough-length-24+'
    expect(isCronAuthorized(requestWithAuth('Bearer cron-secret-with-enough-length-24+'))).toBe(true)
    expect(isCronAuthorized(requestWithAuth('Bearer wrong'))).toBe(false)
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  })
})
