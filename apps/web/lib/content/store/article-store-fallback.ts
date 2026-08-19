/**
 * Production content reads must not silently fall back to an empty file store
 * when Postgres is configured but unavailable. Prefer last-known-good inventory.
 */
export type ArticleStoreFallback = 'stale-cache' | 'file' | 'degraded-empty'

export function resolveArticleStoreFallback(input: {
  production: boolean
  postgresConfigured: boolean
  hasLastKnownGood: boolean
}): ArticleStoreFallback {
  if (input.hasLastKnownGood) return 'stale-cache'
  if (input.production && input.postgresConfigured) return 'degraded-empty'
  return 'file'
}
