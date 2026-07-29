import type { HomepageSection, StoryCardData } from '@nagarikwatch/db'

export type HomepageStreamItem =
  | { kind: 'section'; section: HomepageSection }
  | { kind: 'featured'; stories: StoryCardData[]; variant: 'duo' | 'trio' }

type BuildHomepageStreamOptions = {
  /** Insert a featured band after every N category sections. */
  bandEvery?: number
  /** Stories per mid-scroll band. */
  bandSize?: number
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
  const bandEvery = options.bandEvery ?? 2
  const bandSize = options.bandSize ?? 3
  const items: HomepageStreamItem[] = []
  let bandCursor = 0
  let sectionIndex = 0

  for (const section of sections) {
    items.push({ kind: 'section', section })
    sectionIndex++

    if (sectionIndex % bandEvery !== 0 || bandCursor >= bandPool.length) continue

    const chunk = bandPool.slice(bandCursor, bandCursor + bandSize)
    if (chunk.length < 2) continue

    items.push({
      kind: 'featured',
      stories: chunk,
      variant: chunk.length >= 3 ? 'trio' : 'duo',
    })
    bandCursor += chunk.length
  }

  return items
}
