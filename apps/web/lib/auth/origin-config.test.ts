import { describe, expect, it } from 'vitest'
import { isProductionSafeOrigin, resolveAuthBaseUrl } from './origin-config'

describe('auth origin configuration', () => {
  it('rejects loopback and plain-http origins for production auth', () => {
    expect(isProductionSafeOrigin('http://www.nagarikwatch.com')).toBe(false)
    expect(isProductionSafeOrigin('https://localhost:3000')).toBe(false)
    expect(isProductionSafeOrigin('https://127.0.0.1:3000')).toBe(false)
  })

  it('ignores a stale localhost Better Auth URL in production', () => {
    expect(
      resolveAuthBaseUrl(
        {
          NODE_ENV: 'production',
          BETTER_AUTH_URL: 'http://localhost:3000',
          NEXT_PUBLIC_SITE_URL: 'https://www.nagarikwatch.com',
        },
        'https://www.nagarikwatch.com',
      ),
    ).toBe('https://www.nagarikwatch.com')
  })

  it('keeps localhost available in development', () => {
    expect(
      resolveAuthBaseUrl(
        { NODE_ENV: 'development', BETTER_AUTH_URL: 'http://localhost:3000' },
        'http://localhost:3000',
      ),
    ).toBe('http://localhost:3000')
  })
})
