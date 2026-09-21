import { describe, expect, it } from 'vitest'
import {
  MAX_SITEMAP_SHARDS,
  SITEMAP_URLS_PER_SHARD,
  parseShardId,
  sitemapShardCount,
  sitemapShardIds,
  sitemapShardSlice,
} from './sitemap-shards'

describe('sitemapShardCount', () => {
  it('keeps a small archive in one file', () => {
    expect(sitemapShardCount(0)).toBe(1)
    expect(sitemapShardCount(1)).toBe(1)
    expect(sitemapShardCount(SITEMAP_URLS_PER_SHARD)).toBe(1)
  })

  it('adds a file the moment the cap is exceeded', () => {
    expect(sitemapShardCount(SITEMAP_URLS_PER_SHARD + 1)).toBe(2)
    expect(sitemapShardCount(SITEMAP_URLS_PER_SHARD * 3)).toBe(3)
  })

  it('refuses to plan an unbounded build from a nonsense total', () => {
    expect(sitemapShardCount(Number.NaN)).toBe(1)
    expect(sitemapShardCount(-5)).toBe(1)
    expect(sitemapShardCount(SITEMAP_URLS_PER_SHARD * 10_000)).toBe(MAX_SITEMAP_SHARDS)
  })
})

describe('sitemapShardSlice', () => {
  const items = Array.from({ length: SITEMAP_URLS_PER_SHARD + 7 }, (_, index) => index)

  it('covers every item exactly once across the planned shards', () => {
    const covered = sitemapShardIds(items.length).flatMap((shard) =>
      sitemapShardSlice(items, shard),
    )
    expect(covered).toEqual(items)
  })

  it('returns nothing for a shard past the end', () => {
    expect(sitemapShardSlice(items, 9)).toEqual([])
    expect(sitemapShardSlice(items, -1)).toEqual([])
    expect(sitemapShardSlice(items, 1.5)).toEqual([])
  })
})

describe('parseShardId', () => {
  it('accepts plain in-range ids', () => {
    expect(parseShardId('0')).toBe(0)
    expect(parseShardId('12')).toBe(12)
  })

  it('rejects anything that is not one', () => {
    // A route param is attacker-controlled; a shard id is three digits or less
    // and nothing else.
    for (const raw of ['', '-1', '1.0', '01a', '999', String(MAX_SITEMAP_SHARDS), '1e3']) {
      expect(parseShardId(raw), raw).toBeNull()
    }
  })
})
