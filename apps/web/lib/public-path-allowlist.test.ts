import { describe, expect, it } from 'vitest'
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

  it('still lets unknown slug-shaped segments through', () => {
    // Deliberate: a category created in the CMS must not 404 before the seed
    // list or NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS catches up. The App Router
    // answers with the recovery UI instead.
    expect(isAllowedPublicFirstSegment('brand-new-desk')).toBe(true)
  })
})
