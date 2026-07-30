import 'server-only'
import type { StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { getMostReadStats } from '@/lib/engagement/store'
import { PROVINCES } from '@/lib/site'

export type ProvinceHeatRow = {
  slug: string
  nameNe: string
  nameEn: string
  score: number
  readers: number
  stories: number
}

/**
 * Relative reader heat by province from first-party most-read + published inventory.
 * Honest zeros when engagement is thin — never invents provincial traffic.
 */
export async function resolveProvinceHeat(options?: {
  windowDays?: number
  catalog?: StoryCardData[]
}): Promise<ProvinceHeatRow[]> {
  const [{ items }, stats] = await Promise.all([
    options?.catalog
      ? Promise.resolve({ items: options.catalog })
      : getStories({ locale: 'ne', perPage: 120 }),
    getMostReadStats(options?.windowDays ?? 7, 120).catch(() => []),
  ])

  const readersBySlug = new Map(stats.map((row) => [row.articleSlug, row.uniqueReaders]))
  const byProvince = new Map<string, { readers: number; stories: number }>()

  for (const story of items) {
    const province = story.province?.trim()
    if (!province) continue
    const current = byProvince.get(province) ?? { readers: 0, stories: 0 }
    current.stories += 1
    current.readers += readersBySlug.get(story.slug) ?? 0
    byProvince.set(province, current)
  }

  const maxReaders = Math.max(1, ...[...byProvince.values()].map((row) => row.readers))

  return PROVINCES.map((province) => {
    const row = byProvince.get(province.slug) ?? { readers: 0, stories: 0 }
    return {
      slug: province.slug,
      nameNe: province.nameNe,
      nameEn: province.nameEn,
      readers: row.readers,
      stories: row.stories,
      score: row.readers > 0 ? row.readers / maxReaders : 0,
    }
  })
}
