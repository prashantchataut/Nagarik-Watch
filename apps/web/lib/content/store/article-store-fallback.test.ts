import { describe, expect, it } from 'vitest'
import { resolveArticleStoreFallback } from './article-store-fallback'

describe('resolveArticleStoreFallback', () => {
  it('serves last-known-good inventory when a successful read already happened', () => {
    expect(
      resolveArticleStoreFallback({
        production: true,
        postgresConfigured: true,
        hasLastKnownGood: true,
      }),
    ).toBe('stale-cache')
  })

  it('does not fall back to the file store in production when Postgres is configured', () => {
    expect(
      resolveArticleStoreFallback({
        production: true,
        postgresConfigured: true,
        hasLastKnownGood: false,
      }),
    ).toBe('degraded-empty')
  })

  it('uses the local file store in development', () => {
    expect(
      resolveArticleStoreFallback({
        production: false,
        postgresConfigured: false,
        hasLastKnownGood: false,
      }),
    ).toBe('file')
  })
})
