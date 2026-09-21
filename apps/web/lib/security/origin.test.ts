import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { isTrustedWriteRequest } from './origin'

function requestWith(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as NextRequest
}

describe('isTrustedWriteRequest', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects a spoofed Host origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ALLOW_HOST_ORIGIN_TRUST', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.nagarikwatch.com')
    expect(
      isTrustedWriteRequest(
        requestWith({
          origin: 'https://evil.example',
          host: 'evil.example',
          'x-forwarded-host': 'evil.example',
        }),
      ),
    ).toBe(false)
  })

  it('accepts the configured site origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ALLOW_HOST_ORIGIN_TRUST', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.nagarikwatch.com')
    expect(
      isTrustedWriteRequest(
        requestWith({
          origin: 'https://www.nagarikwatch.com',
          host: 'www.nagarikwatch.com',
        }),
      ),
    ).toBe(true)
  })

  it('allows matching Host origins outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(
      isTrustedWriteRequest(
        requestWith({
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
        }),
      ),
    ).toBe(true)
  })
})
