import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { isAllowedPublicFirstSegment } from '@/lib/public-path-allowlist'

describe('public first-segment allowlist', () => {
  it('allows seeded category slugs', () => {
    expect(isAllowedPublicFirstSegment('politics')).toBe(true)
    expect(isAllowedPublicFirstSegment('sports')).toBe(true)
  })

  it('allows reserved product routes', () => {
    expect(isAllowedPublicFirstSegment('search')).toBe(true)
    expect(isAllowedPublicFirstSegment('patro')).toBe(true)
  })

  it('rejects locale codes so /en/ne and /en/en are hard 404s', () => {
    // `en` is in RESERVED for the top-level /en tree; without the explicit
    // rejection it would also make /en/en a valid category URL.
    expect(isAllowedPublicFirstSegment('en')).toBe(false)
    expect(isAllowedPublicFirstSegment('ne')).toBe(false)
  })

  it('rejects internal and malformed shapes', () => {
    expect(isAllowedPublicFirstSegment('_next')).toBe(false)
    expect(isAllowedPublicFirstSegment('apiary')).toBe(false)
    expect(isAllowedPublicFirstSegment('Politics')).toBe(false)
    expect(isAllowedPublicFirstSegment('a')).toBe(false)
  })

  it('rejects unknown slug-shaped segments by default', () => {
    // This is what makes an unknown URL a real 404 rather than a soft one.
    expect(isAllowedPublicFirstSegment('brand-new-desk')).toBe(false)
  })

  it('lets them through when the permissive flag is set', () => {
    vi.stubEnv('NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS', '1')
    expect(isAllowedPublicFirstSegment('brand-new-desk')).toBe(true)
    vi.unstubAllEnvs()
  })
})

describe('allowlist covers every real public route', () => {
  // Turning `NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS` off makes this list
  // load-bearing: a top-level route directory that is missing from it becomes a
  // hard 404 for readers. `preeti-unicode` was already in that state and only
  // worked because the permissive fallback caught it. Read the router tree at
  // test time so adding a page cannot silently 404 it.
  const localeDir = resolve(__dirname, '../app/[locale]')
  const routeSegments = readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('[') && !name.startsWith('(') && name !== '__not-found')

  it('finds the router tree', () => {
    expect(routeSegments.length).toBeGreaterThan(20)
  })

  it.each(routeSegments)('allows /%s', (segment) => {
    expect(isAllowedPublicFirstSegment(segment)).toBe(true)
  })
})
