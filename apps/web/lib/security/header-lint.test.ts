import { describe, expect, it } from 'vitest'
import { hasWeakDirectives, lintSecurityHeaders } from './header-lint'

const GOOD_HEADERS = {
  'content-security-policy': "default-src 'self'",
  'strict-transport-security': 'max-age=63072000',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
}

describe('lintSecurityHeaders', () => {
  it('scores a fully-configured header set as 1', () => {
    const result = lintSecurityHeaders(GOOD_HEADERS)
    expect(result.score).toBe(1)
    expect(result.missing).toEqual([])
  })

  it('reports missing headers by name', () => {
    const result = lintSecurityHeaders({ 'content-security-policy': "default-src 'self'" })
    expect(result.present).toBe(1)
    expect(result.missing).toContain('strict-transport-security')
    expect(result.score).toBeCloseTo(0.25)
  })

  it('accepts a Headers instance', () => {
    const headers = new Headers(GOOD_HEADERS)
    expect(lintSecurityHeaders(headers).score).toBe(1)
  })
})

describe('hasWeakDirectives', () => {
  it('flags no warnings for a strict configuration', () => {
    expect(hasWeakDirectives(GOOD_HEADERS)).toEqual([])
  })

  it('flags unsafe-inline CSP and a short HSTS max-age', () => {
    const warnings = hasWeakDirectives({
      'content-security-policy': "default-src 'self' 'unsafe-inline'",
      'strict-transport-security': 'max-age=60',
    })
    expect(warnings.length).toBe(2)
  })
})
