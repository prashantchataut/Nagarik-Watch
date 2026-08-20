import type { Metadata } from 'next'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { BreakingTicker } from '@/components/BreakingTicker'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { dedupeHomepage } from '@/lib/content/homepage-dedup'
import { getHomepage } from '@/lib/content'
import { getActivePoll } from '@/lib/polls-admin'
import { HomeBillboardAd } from '@/components/home/HomeBillboardAd'
import { HomeClosingDesk } from '@/components/home/HomeClosingDesk'
import { HomeEmptyEdition } from '@/components/home/HomeEmptyEdition'
import { HomeMidAd } from '@/components/home/HomeMidAd'
import { LatestRail } from '@/components/home/LatestRail'
import { PollOfDay } from '@/components/home/PollOfDay'
import { PortalFeed } from '@/components/home/PortalFeed'
import { ProvinceHub } from '@/components/home/ProvinceHub'
import { SectionBlock, type HomeSectionLayout } from '@/components/home/SectionBlock'

const SECTION_LAYOUT_BY_SLUG: Record<string, HomeSectionLayout> = {
  politics: 'news-desk',
  society: 'compact-desk',
  business: 'split',
  sports: 'photo-desk',
  entertainment: 'photo-desk',
  world: 'news-desk',
  opinion: 'voices',
  literature: 'split',
  technology: 'compact-desk',
  health: 'news-desk',
  education: 'compact-desk',
  interview: 'voices',
  'photo-story': 'photo-desk',
  video: 'photo-desk',
  diaspora: 'news-desk',
}

function monthDayInKathmandu(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  return `${month}-${day}`
}

function yearInKathmandu(value: Date): number {
  const year = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
  }).format(value)
  return Number(year)
}

export function homeMetadata(locale: Locale): Metadata {
  return {
    title: locale === 'en' ? 'Independent news from Nepal' : 'नेपालको स्वतन्त्र समाचार',
    description:
      locale === 'en'
        ? 'Original reporting, public-service information and analysis from Nagarik Watch.'
        : 'नागरिक वाचबाट मौलिक रिपोर्टिङ, सार्वजनिक सेवा सूचना र विश्लेषण।',
    alternates: canonicalAlternates(locale, '/'),
  }
}

export async function HomePage({ locale }: { locale: Locale }) {
  const [homepage, activePoll] = await Promise.all([
    getHomepage().catch(() => null),
    getActivePoll().catch(() => null),
  ])

  if (!homepage) return <HomeEmptyEdition locale={locale} />

  const edition = dedupeHomepage(homepage)
  const editionStories = [
    edition.lead,
    ...edition.featured,
    ...edition.secondary,
    ...edition.breaking,
    ...edition.sections.flatMap((section) => [section.lead, ...section.items]),
  ].filter((story): story is StoryCardData => Boolean(story))
  const catalog = Array.from(new Map(editionStories.map((story) => [story.id, story])).values())

  const frontPageStories: StoryCardData[] = []
  const frontPageIds = new Set<string>()
  for (const story of [edition.lead, ...edition.featured, ...edition.secondary]) {
    if (!story || frontPageIds.has(story.id)) continue
    frontPageIds.add(story.id)
    frontPageStories.push(story)
    if (frontPageStories.length >= 5) break
  }

  const aboveFoldExclude = new Set<string>([
    ...frontPageIds,
    ...edition.breaking.map((story) => story.id),
  ])
  const latest = [...catalog]
    .filter((story) => !aboveFoldExclude.has(story.id))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 10)

  const today = new Date()
  const monthDay = monthDayInKathmandu(today)
  const currentYear = yearInKathmandu(today)
  const historyStories = catalog
    .filter((story) => {
      const published = new Date(story.publishedAt)
      if (Number.isNaN(published.getTime())) return false
      if (yearInKathmandu(published) >= currentYear) return false
      return monthDayInKathmandu(published) === monthDay
    })
    .slice(0, 5)

  const photoOfDay =
    catalog.find(
      (story) =>
        !aboveFoldExclude.has(story.id) &&
        Boolean(story.heroImage?.url) &&
        !story.heroImage!.url.startsWith('data:') &&
        (Boolean(story.hasGallery) || story.category.slug === 'photo-story'),
    ) ?? null

  const populatedDesks = edition.sections.filter(
    (section) => Boolean(section.lead) || section.items.length > 0,
  )
  const firstDesks = populatedDesks.slice(0, 2)
  const remainingDesks = populatedDesks.slice(2)

  return (
    <div className="home-edition">
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pb-8 pt-2 sm:px-4 sm:pt-3 lg:pb-10">
        <PortalFeed stories={frontPageStories} locale={locale} />

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,19rem)] xl:items-start xl:gap-7">
          <div className="min-w-0 space-y-5 sm:space-y-6">
            {firstDesks.map((section) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={SECTION_LAYOUT_BY_SLUG[section.category.slug] ?? 'news-desk'}
              />
            ))}

            <HomeMidAd locale={locale} />
            <ProvinceHub locale={locale} stories={catalog} />

            {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}

            {remainingDesks.map((section) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={SECTION_LAYOUT_BY_SLUG[section.category.slug] ?? 'news-desk'}
              />
            ))}
          </div>

          {latest.length > 0 ? (
            <aside className="hidden min-w-0 xl:block">
              <div className="sticky top-24">
                <LatestRail stories={latest} locale={locale} compact headingId="latest-rail-title" />
              </div>
            </aside>
          ) : null}
        </div>

        <HomeClosingDesk
          locale={locale}
          historyStories={historyStories}
          historyMode="anniversary"
          photoOfDay={photoOfDay}
        />
        <HomeBillboardAd locale={locale} />
      </div>
    </div>
  )
}
