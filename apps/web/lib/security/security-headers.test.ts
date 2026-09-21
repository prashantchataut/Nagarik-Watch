import { describe, expect, it } from 'vitest'
import { SECURITY_HEADER_BASELINE, contentSecurityPolicy, securityHeaders } from './headers'
import { hasWeakDirectives, lintSecurityHeaders } from './header-lint'

/**
 * Regression guard for the bug this module fixed: the repo declared a security
 * baseline in `baseline-headers.json` that `next.config.ts` never actually
 * sent (no CSP, no HSTS, no Permissions-Policy on any response).
 */
describe('shipped security headers', () => {
  it('sends every header in the declared baseline on every route', () => {
    const shipped = securityHeaders({ dev: false })
    const result = lintSecurityHeaders(Object.fromEntries(shipped.map((h) => [h.key, h.value])))
    expect(result.missing).toEqual([])
    expect(result.score).toBe(1)
  })

  it('includes the headers that were previously missing at runtime', () => {
    const keys = securityHeaders({ dev: false }).map((h) => h.key.toLowerCase())
    expect(keys).toContain('content-security-policy')
    expect(keys).toContain('strict-transport-security')
    expect(keys).toContain('permissions-policy')
    expect(keys).toContain('cross-origin-opener-policy')
  })

  it('keeps a long HSTS max-age and nosniff', () => {
    const shipped = Object.fromEntries(securityHeaders({ dev: false }).map((h) => [h.key, h.value]))
    expect(shipped['Strict-Transport-Security']).toMatch(/max-age=\d{6,}/)
    expect(shipped['X-Content-Type-Options']).toBe('nosniff')
    expect(shipped['Content-Security-Policy']).toContain("object-src 'none'")
    expect(shipped['Content-Security-Policy']).toContain("frame-ancestors 'self'")
  })

  it('never ships unsafe-eval in production but allows it for the dev runtime', () => {
    expect(contentSecurityPolicy({ dev: false })).not.toContain('unsafe-eval')
    expect(contentSecurityPolicy({ dev: true })).toContain('unsafe-eval')
  })

  it('does not mutate the shared baseline when building dev headers', () => {
    const before = JSON.stringify(SECURITY_HEADER_BASELINE)
    securityHeaders({ dev: true })
    expect(JSON.stringify(SECURITY_HEADER_BASELINE)).toBe(before)
  })

  it('has no duplicate header keys', () => {
    const keys = securityHeaders({ dev: false }).map((h) => h.key.toLowerCase())
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('baseline self-consistency', () => {
  it('documents the remaining unsafe-inline script allowance honestly', () => {
    // script-src still needs 'unsafe-inline' until a nonce pipeline lands.
    // If that ever changes, this test should be deleted deliberately.
    const warnings = hasWeakDirectives(
      Object.fromEntries(securityHeaders({ dev: false }).map((h) => [h.key, h.value])),
    )
    expect(warnings.some((warning) => warning.startsWith('content-security-policy'))).toBe(true)
  })
})
