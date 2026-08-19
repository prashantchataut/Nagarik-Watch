import { afterEach, describe, expect, it } from 'vitest'
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
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    ALLOW_HOST_ORIGIN_TRUST: process.env.ALLOW_HOST_ORIGIN_TRUST,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  afterEach(() => {
    process.env.NODE_ENV = previous.NODE_ENV
    if (previous.ALLOW_HOST_ORIGIN_TRUST === undefined) delete process.env.ALLOW_HOST_ORIGIN_TRUST
    else process.env.ALLOW_HOST_ORIGIN_TRUST = previous.ALLOW_HOST_ORIGIN_TRUST
    if (previous.NEXT_PUBLIC_SITE_URL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = previous.NEXT_PUBLIC_SITE_URL
  })

  it('rejects a spoofed Host origin in production', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ALLOW_HOST_ORIGIN_TRUST
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.nagarikwatch.com'
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
    process.env.NODE_ENV = 'production'
    delete process.env.ALLOW_HOST_ORIGIN_TRUST
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.nagarikwatch.com'
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
    process.env.NODE_ENV = 'development'
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
