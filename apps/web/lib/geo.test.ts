import { describe, expect, it } from 'vitest'
import { DISTRICTS, DISTRICT_SLUGS, PROVINCES, findDistrict } from '@/lib/site'

describe('district catalog', () => {
  it('names districts, not the cities inside them', () => {
    // The desk list used to carry pokhara, biratnagar and bharatpur, which are
    // cities in Kaski, Morang and Chitwan. A heading reading "पोखरा जिल्ला" is
    // wrong in a way a Nepali reader sees immediately.
    const slugs = new Set(DISTRICT_SLUGS)
    for (const city of ['pokhara', 'biratnagar', 'bharatpur']) {
      expect(slugs.has(city as never)).toBe(false)
    }
    expect(slugs.has('kaski' as never)).toBe(true)
    expect(slugs.has('morang' as never)).toBe(true)
    expect(slugs.has('chitwan' as never)).toBe(true)
  })

  it('carries a Devanagari name for every desk', () => {
    // The route used to title-case the slug, which can only ever produce Latin.
    for (const district of DISTRICTS) {
      expect(district.nameNe).toMatch(/[ऀ-ॿ]/u)
      expect(district.nameEn).not.toBe('')
    }
  })

  it('places every district in a real province', () => {
    const provinces = new Set(PROVINCES.map((province) => province.slug))
    for (const district of DISTRICTS) {
      expect(provinces.has(district.province)).toBe(true)
    }
  })

  it('keeps the slug list derived and unique', () => {
    // The prerender params, the sitemap and the 404 check all read this list;
    // a hand-maintained copy is how they drift apart.
    expect(DISTRICT_SLUGS).toEqual(DISTRICTS.map((district) => district.slug))
    expect(new Set(DISTRICT_SLUGS).size).toBe(DISTRICT_SLUGS.length)
  })

  it('resolves a known slug and refuses an unknown one', () => {
    expect(findDistrict('kathmandu')?.nameNe).toBe('काठमाडौं')
    expect(findDistrict('not-a-district')).toBeNull()
    expect(findDistrict('')).toBeNull()
  })
})
