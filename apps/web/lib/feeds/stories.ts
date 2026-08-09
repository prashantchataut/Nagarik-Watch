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
  return {
    title: locale === 'en' ? story.titleEn || story.titleNe : story.titleNe,
    summary:
      locale === 'en'
        ? story.deckEn || story.titleEn || story.titleNe
        : story.deckNe || story.titleNe,
    canonicalUrl: `${SITE_URL}${path}`,
    publishedAt: new Date(story.publishedAt).toISOString(),
  }
}
