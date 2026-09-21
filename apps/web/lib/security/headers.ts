import baseline from './baseline-headers.json'

export type HeaderPair = { key: string; value: string }

/**
 * The declared security baseline. `baseline-headers.json` is the contract the
 * admin security tooling and `header-lint.ts` score against; `next.config.ts`
 * ships exactly this list, and `security-headers.test.ts` fails if the two ever
 * drift. Before this module existed the baseline was declared but never sent.
 */
export const SECURITY_HEADER_BASELINE = baseline as readonly HeaderPair[]

/**
 * Development needs `unsafe-eval` for the Turbopack/HMR runtime. Production
 * must never ship it, so the CSP is built per-environment from the baseline.
 */
export function contentSecurityPolicy(options: { dev: boolean }): string {
  const declared =
    SECURITY_HEADER_BASELINE.find((header) => header.key === 'Content-Security-Policy')?.value ?? ''
  if (!options.dev) return declared
  return declared.replace(/script-src([^;]*)/, "script-src$1 'unsafe-eval'")
}

/** Full response header set for every route. */
export function securityHeaders(options: { dev: boolean } = { dev: false }): HeaderPair[] {
  return SECURITY_HEADER_BASELINE.map((header) =>
    header.key === 'Content-Security-Policy'
      ? { key: header.key, value: contentSecurityPolicy(options) }
      : { ...header },
  )
}

/** Headers that are only meaningful on a secure origin. */
export const HTTPS_ONLY_HEADERS = new Set(['strict-transport-security'])
