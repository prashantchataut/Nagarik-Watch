import type { HomepageSection, StoryCardData } from '@nagarikwatch/db'

export type HomepageStreamItem =
  | { kind: 'section'; section: HomepageSection }
  | { kind: 'featured'; stories: StoryCardData[]; variant: 'duo' | 'trio'; categorySlug?: string }

type BuildHomepageStreamOptions = {
  /** Insert a featured band after every N category sections. */
  bandEvery?: number
  /** Stories per mid-scroll band. */
  bandSize?: number
  /**
   * Prefer one story from the preceding section’s category in each band
   * so mid-scroll featured feels continuous with the desk just read.
   */
  categoryAware?: boolean
}

function takeCategoryMatch(
  pool: StoryCardData[],
  used: Set<string>,
  categorySlug: string,
): StoryCardData | null {
  const match = pool.find((story) => !used.has(story.id) && story.category.slug === categorySlug)
  return match ?? null
}

function takeNext(pool: StoryCardData[], used: Set<string>): StoryCardData | null {
  return pool.find((story) => !used.has(story.id)) ?? null
}

/**
 * Interleave category sections with featured bands so the homepage surfaces
 * multiple editorial picks as the reader scrolls (not only the hero lead).
 */
export function buildHomepageStream(
  sections: HomepageSection[],
  bandPool: StoryCardData[],
  options: BuildHomepageStreamOptions = {},
): HomepageStreamItem[] {
  const bandEvery = Math.max(1, options.bandEvery ?? 2)
  const bandSize = Math.max(2, options.bandSize ?? 3)
  const categoryAware = options.categoryAware !== false
  const items: HomepageStreamItem[] = []
  const used = new Set<string>()
  let sectionIndex = 0

  for (const section of sections) {
    items.push({ kind: 'section', section })
    sectionIndex++

    if (sectionIndex % bandEvery !== 0) continue

    const chunk: StoryCardData[] = []
    if (categoryAware) {
      const local = takeCategoryMatch(bandPool, used, section.category.slug)
      if (local) {
        used.add(local.id)
        chunk.push(local)
      }
    }

    while (chunk.length < bandSize) {
      const next = takeNext(bandPool, used)
      if (!next) break
      used.add(next.id)
      chunk.push(next)
    }

    if (chunk.length < 2) continue

    items.push({
      kind: 'featured',
      stories: chunk,
      variant: chunk.length >= 3 ? 'trio' : 'duo',
      categorySlug: section.category.slug,
    })
  }

  return items
}

/** Map experiment variant ids to featured-band spacing. */
export function bandEveryForVariant(variantId: string | null | undefined): number {
  if (variantId === 'band-every-3' || variantId === 'sparse') return 3
  return 2
}

/** Mid-scroll pool after spotlight consumes the first featured slots. */
export function buildFeaturedBandPool(options: {
  featured: StoryCardData[]
  catalog: StoryCardData[]
  excludeIds: Set<string>
  spotlightCount?: number
  max?: number
}): StoryCardData[] {
  const spotlightCount = options.spotlightCount ?? 4
  const max = options.max ?? 9
  const spotlightIds = new Set(options.featured.slice(0, spotlightCount).map((s) => s.id))
  const exclude = new Set([...options.excludeIds, ...spotlightIds])

  const fromFeatured = options.featured.filter((s) => !spotlightIds.has(s.id))
  const fill = options.catalog.filter(
    (s) =>
      !exclude.has(s.id) &&
      !fromFeatured.some((f) => f.id === s.id) &&
      (Boolean(s.editorPick) || Boolean(s.exclusive) || Boolean(s.heroImage?.url)),
  )

  const out: StoryCardData[] = []
  const seen = new Set<string>()
  for (const story of [...fromFeatured, ...fill]) {
    if (seen.has(story.id) || exclude.has(story.id)) continue
    seen.add(story.id)
    out.push(story)
    if (out.length >= max) break
  }
  return out
}
