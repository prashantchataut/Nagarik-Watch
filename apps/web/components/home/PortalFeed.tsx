import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { LeadPackage } from '@/components/home/LeadPackage'

type PortalFeedProps = {
  stories: StoryCardData[]
  locale: Locale
}

/**
 * Legacy homepage entry. Routes to LeadPackage so any stale import or cached
 * build path cannot resurrect stacked centered mega stories.
 */
export function PortalFeed({ stories, locale }: PortalFeedProps) {
  return <LeadPackage stories={stories} locale={locale} />
}
