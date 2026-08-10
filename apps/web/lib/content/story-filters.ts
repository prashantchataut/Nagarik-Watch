import type { ArticleBlock, StoryCardData } from '@nagarikwatch/db'
import type { StoryListOptions } from './source'

/** Detect photo-desk eligibility from card/article signals. */
export function storyHasGallery(story: {
  hasGallery?: boolean
  heroImage?: { url?: string } | null
  bodyNe?: ArticleBlock[]
}): boolean {
  if (story.hasGallery) return true
  const imageBlocks = (story.bodyNe ?? []).filter((b) => b.type === 'image').length
  return imageBlocks >= 2
}

/** Detect video-desk eligibility. */
export function storyHasVideo(story: { hasVideo?: boolean; bodyNe?: ArticleBlock[] }): boolean {
  if (story.hasVideo) return true
  return (story.bodyNe ?? []).some(
    (b) => b.type === 'embed' && (b.provider === 'youtube' || /youtu|vimeo|video/i.test(b.url)),
  )
}

export function matchesStoryListFilters(
  story: StoryCardData & {
    bodyNe?: ArticleBlock[]
    tagSlugs?: string[]
  },
  opts: StoryListOptions,
): boolean {
  if (opts.province && story.province !== opts.province) return false
  if (opts.district && story.district !== opts.district) return false
  if (opts.exclusive === true && !story.exclusive) return false
  if (opts.editorPick === true && !story.editorPick) return false
  if (opts.dataStory === true && !story.dataStory) return false
  if (opts.hasGallery === true && !storyHasGallery(story)) return false
  if (opts.hasVideo === true && !storyHasVideo(story)) return false
  if (opts.factCheck === true) {
    const status = story.factCheckStatus
    if (!status || status === 'not_fact_check') return false
  }
  if (opts.dateFrom) {
    if (Date.parse(story.publishedAt) < Date.parse(opts.dateFrom)) return false
  }
  if (opts.dateTo) {
    if (Date.parse(story.publishedAt) > Date.parse(opts.dateTo)) return false
  }
  if (opts.q?.trim()) {
    const q = opts.q.trim().toLowerCase()
    const hay = [story.titleNe, story.titleEn, story.deckNe, story.deckEn]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}
