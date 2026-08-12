/**
 * Pure helpers for classifying Postgres / pool failures. Kept free of
 * `server-only` so unit tests and route handlers can share one check.
 */

function collectErrorHaystack(error: unknown): string {
  const parts: string[] = []
  let current: unknown = error
  for (let depth = 0; current && depth < 6; depth++) {
    if (current && typeof current === 'object' && 'code' in current) {
      const code = (current as { code?: unknown }).code
      if (code) parts.push(String(code))
    }
    parts.push(current instanceof Error ? current.message : String(current))
    current =
      current instanceof Error
        ? current.cause
        : current && typeof current === 'object' && 'cause' in current
          ? (current as { cause?: unknown }).cause
          : undefined
  }
  return parts.join(' ')
}

export function isDatabaseInfrastructureHaystack(haystack: string): boolean {
  return (
    /\b53300\b/.test(haystack) ||
    /\b57P01\b/.test(haystack) ||
    /\b57P03\b/.test(haystack) ||
    /\b08006\b/.test(haystack) ||
    /\b08001\b/.test(haystack) ||
    /timeout exceeded when trying to connect/i.test(haystack) ||
    /remaining connection slots/i.test(haystack) ||
    /too many connections/i.test(haystack) ||
    /connection terminated/i.test(haystack) ||
    /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(haystack) ||
    /DATABASE_URL is (required|set but)/i.test(haystack) ||
    /shared Postgres pool could not be created/i.test(haystack)
  )
}

export function isDatabaseInfrastructureError(error: unknown): boolean {
  if (!error) return false
  return isDatabaseInfrastructureHaystack(collectErrorHaystack(error))
}
