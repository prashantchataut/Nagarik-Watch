import type { Metadata } from 'next'
import type { StoryCardData } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories } from '@/lib/content'
import { dedupeHomepage } from '@/lib/content/homepage-dedup'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock, type HomeSectionLayout } from '@/components/home/SectionBlock'
import { LatestRail } from '@/components/home/LatestRail'
import { HomeEmptyEdition } from '@/components/home/HomeEmptyEdition'
import { HomeClosingDesk } from '@/components/home/HomeClosingDesk'
import { ProvinceHub } from '@/components/home/ProvinceHub'
import { PollOfDay } from '@/components/home/PollOfDay'
import { getActivePoll } from '@/lib/polls-admin'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { MostReadRail } from '@/components/home/MostReadRail'
import { resolveMostReadStories } from '@/lib/content/most-read-stories'
import { FrontPageLead } from '@/components/home/FrontPageLead'
import { HomeMidAd } from '@/components/home/HomeMidAd'
import { HomeBillboardAd } from '@/components/home/HomeBillboardAd'

export const revalidate = 120

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Independent news from Nepal' : 'नेपालको स्वतन्त्र समाचार',
    description:
      locale === 'en'
        ? 'Original reporting, public-service information and analysis from Nagarik Watch.'
        : 'नागरिक वाचबाट मौलिक रिपोर्टिङ, सार्वजनिक सेवा सूचना र विश्लेषण।',
    alternates: canonicalAlternates(locale, '/'),
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const [homepage, activePoll] = await Promise.all([
    getHomepage().catch(() => null),
    getActivePoll().catch(() => null),
  ])

  if (!homepage) {
    const categories = await getNavCategories().catch(() => [])
    return <HomeEmptyEdition locale={locale} categories={categories} />
  }

  const edition = dedupeHomepage(homepage)
  const editionStories = [
    edition.lead,
    ...edition.featured,
    ...edition.secondary,
    ...edition.breaking,
    ...edition.sections.flatMap((section) => [section.lead, ...section.items]),
  ].filter((story): story is StoryCardData => Boolean(story))
  const catalog = Array.from(
    new Map(editionStories.map((story) => [story.id, story])).values(),
  )

  const frontPageStories: StoryCardData[] = []
  const frontPageIds = new Set<string>()
  for (const story of [edition.lead, ...edition.featured, ...edition.secondary]) {
    if (!story || frontPageIds.has(story.id)) continue
    frontPageIds.add(story.id)
    frontPageStories.push(story)
    if (frontPageStories.length >= 8) break
  }

  const aboveFoldExclude = new Set<string>([
    ...frontPageIds,
    ...edition.breaking.map((story) => story.id),
  ])
  const latest = [...catalog]
    .filter((story) => !aboveFoldExclude.has(story.id))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 8)
  const { stories: mostRead, live: mostReadLive } = await resolveMostReadStories({
    catalog,
    excludeIds: new Set(),
    limit: 6,
    windowDays: 7,
    minLive: 2,
  })

  const today = new Date()
  const monthDay = `${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`
  const anniversaryStories = catalog
    .filter((story) => {
      const published = new Date(story.publishedAt)
      if (Number.isNaN(published.getTime())) return false
      if (published.getUTCFullYear() >= today.getUTCFullYear()) return false
      const md = `${String(published.getUTCMonth() + 1).padStart(2, '0')}-${String(published.getUTCDate()).padStart(2, '0')}`
      return md === monthDay
    })
    .slice(0, 5)
  const archiveFallback = [...catalog]
    .sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
    .slice(0, 5)
  const historyStories = anniversaryStories.length >= 2 ? anniversaryStories : archiveFallback
  const historyMode = anniversaryStories.length >= 2 ? 'anniversary' : 'archive'

  const photoOfDay =
    catalog.find(
      (story) =>
        !aboveFoldExclude.has(story.id) &&
        Boolean(story.heroImage?.url) &&
        !story.heroImage!.url.startsWith('data:') &&
        (Boolean(story.hasGallery) || story.category.slug === 'photo-story'),
    ) ??
    catalog.find(
      (story) =>
        !aboveFoldExclude.has(story.id) &&
        Boolean(story.heroImage?.url) &&
        !story.heroImage!.url.startsWith('data:'),
    ) ??
    null

  const populatedDesks = edition.sections.filter(
    (section) => Boolean(section.lead) || section.items.length > 0,
  )
  const firstDesks = populatedDesks.slice(0, 3)
  const remainingDesks = populatedDesks.slice(3)

  return (
    <div className="home-edition">
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pt-4 sm:px-4 sm:pt-5">
        <FrontPageLead stories={frontPageStories} locale={locale} />

        <div className="mt-5 xl:hidden">
          <LatestRail
            stories={latest.slice(0, 4)}
            locale={locale}
            headingId="latest-rail-title-mobile"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(17.5rem,0.31fr)] xl:items-start xl:gap-7">
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
            <ProvinceHub locale={locale} />

            {activePoll ? (
              <div className="xl:hidden">
                <PollOfDay
                  locale={locale}
                  poll={activePoll}
                  headingId={`poll-${activePoll.id}-label-mobile`}
                />
              </div>
            ) : null}

            {remainingDesks.map((section) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={SECTION_LAYOUT_BY_SLUG[section.category.slug] ?? 'news-desk'}
              />
            ))}
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="sticky top-24 space-y-6">
              <LatestRail stories={latest} locale={locale} compact headingId="latest-rail-title" />
              <MostReadRail
                stories={mostRead}
                locale={locale}
                headingId="most-read-title"
                live={mostReadLive}
              />
              {activePoll ? (
                <PollOfDay
                  locale={locale}
                  poll={activePoll}
                  headingId={`poll-${activePoll.id}-label`}
                />
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-page px-3 pb-8 sm:px-4 lg:pb-10">
        <HomeBillboardAd locale={locale} className="mt-6" />
        <HomeClosingDesk
          locale={locale}
          historyStories={historyStories}
          historyMode={historyMode}
          photoOfDay={photoOfDay}
        />
      </div>
    </div>
  )
}
