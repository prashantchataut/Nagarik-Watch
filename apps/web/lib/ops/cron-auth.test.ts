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
    process.env.CRON_SECRET = 'too-short-even-if-twenty-four!!'
    expect(isCronAuthorized(requestWithAuth('Bearer too-short-even-if-twenty-four!!'))).toBe(false)
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  })

  it('accepts a matching Bearer token when the secret is long enough', () => {
    const previous = process.env.CRON_SECRET
    const secret = 'cron-secret-with-enough-length-32chars!!'
    process.env.CRON_SECRET = secret
    expect(isCronAuthorized(requestWithAuth(`Bearer ${secret}`))).toBe(true)
    expect(isCronAuthorized(requestWithAuth('Bearer wrong-secret-with-enough-length-xxx'))).toBe(false)
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  })
})
