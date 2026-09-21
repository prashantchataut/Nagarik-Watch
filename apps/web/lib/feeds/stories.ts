import 'server-only'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { localizeHref } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/site'

export async function getDistributionStories(locale: Locale, limit = 50): Promise<StoryCardData[]> {
  const { items } = await getStories({ locale, perPage: limit })
  const distributable = items.filter((item) => item.noIndex !== true)
  return locale === 'en' ? distributable.filter((item) => item.hasEnglish) : distributable
}

export function distributionStory(story: StoryCardData, locale: Locale) {
  const path = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  // Newest first: a feed item shows one line, and the newest correction is the
  // one that describes the story as it stands now.
  const latestCorrection = [...(story.corrections ?? [])].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : 0,
  )[0]
  const correctionNote = latestCorrection
    ? locale === 'en'
      ? `Correction: ${latestCorrection.summaryEn || latestCorrection.summaryNe}`
      : `सच्याइएको: ${latestCorrection.summaryNe}`
    : undefined
  const updated =
    story.updatedAt && story.updatedAt !== story.publishedAt
      ? new Date(story.updatedAt).toISOString()
      : undefined
  return {
    title: locale === 'en' ? story.titleEn || story.titleNe : story.titleNe,
    summary:
      locale === 'en'
        ? story.deckEn || story.titleEn || story.titleNe
        : story.deckNe || story.titleNe,
    canonicalUrl: `${SITE_URL}${path}`,
    publishedAt: new Date(story.publishedAt).toISOString(),
    updatedAt: updated,
    /** Appended to the feed description so the correction travels with the story. */
    correctionNote,
  }
}
