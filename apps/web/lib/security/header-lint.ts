/**
 * Pure security-header lint. Checks the same baseline response headers the
 * algorithms catalog and admin security tooling reference, so both stay in
 * sync with one honest implementation instead of duplicating the header
 * list and scoring.
 */

export const REQUIRED_SECURITY_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
] as const

export type SecurityHeaderLintResult = {
  score: number
  present: number
  needed: number
  missing: string[]
}

function normalizeHeaders(headers: Headers | Record<string, string | null | undefined>): Record<string, string> {
  if (headers instanceof Headers) {
    const out: Record<string, string> = {}
    for (const name of REQUIRED_SECURITY_HEADERS) {
      const value = headers.get(name)
      if (value) out[name] = value
    }
    return out
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value) out[key.toLowerCase()] = value
  }
  return out
}

export function lintSecurityHeaders(
  headers: Headers | Record<string, string | null | undefined>,
): SecurityHeaderLintResult {
  const normalized = normalizeHeaders(headers)
  const missing = REQUIRED_SECURITY_HEADERS.filter((name) => !normalized[name])
  const present = REQUIRED_SECURITY_HEADERS.length - missing.length
  return {
    score: present / REQUIRED_SECURITY_HEADERS.length,
    present,
    needed: REQUIRED_SECURITY_HEADERS.length,
    missing,
  }
}

/** Weak/example values that should never ship — a header can be "present" but still unsafe. */
export function hasWeakDirectives(headers: Headers | Record<string, string | null | undefined>): string[] {
  const normalized = normalizeHeaders(headers)
  const warnings: string[] = []
  const csp = normalized['content-security-policy']
  if (csp && /unsafe-inline|unsafe-eval|\*(?!\.)/i.test(csp)) {
    warnings.push('content-security-policy allows unsafe-inline/unsafe-eval or a bare wildcard source')
  }
  const hsts = normalized['strict-transport-security']
  if (hsts && !/max-age=\d{6,}/i.test(hsts)) {
    warnings.push('strict-transport-security max-age is too short for a production HSTS policy')
  }
  const xcto = normalized['x-content-type-options']
  if (xcto && xcto.toLowerCase() !== 'nosniff') {
    warnings.push('x-content-type-options should be "nosniff"')
  }
  return warnings
}
