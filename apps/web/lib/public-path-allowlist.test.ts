import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allowedPublicFirstSegments, isAllowedPublicFirstSegment } from './public-path-allowlist'

/**
 * Regression guard for the middleware allowlist.
 *
 * `proxy.ts` hard-404s any first segment the allowlist does not name, so a new
 * page under `app/[locale]` that nobody added to the list becomes an instant
 * 404 in production. That is exactly what happened to `/preeti-unicode` when
 * the permissive slug heuristic was retired (caught by probing a production
 * build, 2026-09-23) — this test makes it a build failure instead.
 */
function realFirstSegments(): string[] {
  const dir = fileURLToPath(new URL('../app/[locale]', import.meta.url))
  return readdirSync(dir).filter((name) => {
    // Private folders, route groups and dynamic segments are not fixed paths.
    if (name.startsWith('__') || name.startsWith('(') || name.startsWith('[')) return false
    return statSync(`${dir}/${name}`).isDirectory()
  })
}

describe('public path allowlist', () => {
  it('allows every real first segment under app/[locale]', () => {
    const segments = realFirstSegments()
    expect(segments.length).toBeGreaterThan(40)
    const rejected = segments.filter((segment) => !isAllowedPublicFirstSegment(segment))
    expect(rejected, `these routes would hard-404 in proxy.ts: ${rejected.join(', ')}`).toEqual([])
  })

  it('rejects unknown, reserved-prefix and non-slug segments', () => {
    for (const segment of ['no-such-category-xyz', 'ne', 'api', 'admin', '_next', 'a', 'ZZ']) {
      expect(isAllowedPublicFirstSegment(segment)).toBe(false)
    }
  })

  it('accepts every canonical desk and hub', () => {
    const allowed = new Set(allowedPublicFirstSegments())
    for (const segment of ['politics', 'sports', 'opinion', 'latest', 'trending', 'patro']) {
      expect(allowed.has(segment)).toBe(true)
    }
  })
})
