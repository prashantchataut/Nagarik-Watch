import type { Metadata } from 'next'
import type { HomepageSection, Locale, StoryCardData } from '@nagarikwatch/db'
import { BreakingTicker } from '@/components/BreakingTicker'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { dedupeHomepage } from '@/lib/content/homepage-dedup'
import { getHomepage } from '@/lib/content'
import { getActivePoll } from '@/lib/polls-admin'
import { EditorialSpotlight } from '@/components/home/EditorialSpotlight'
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

const CORE_DESKS = ['politics', 'society', 'business', 'sports'] as const
const FEATURE_PAIR = ['entertainment', 'world'] as const
const SIGNATURE_DESKS = ['opinion', 'literature'] as const
const SPOTLIGHT_DESKS = new Set(['diaspora', 'photo-story'])

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

function sectionFeature(
  section: HomepageSection | undefined,
  excluded: Set<string>,
): StoryCardData | null {
  if (!section) return null
  const candidates = section.lead ? [section.lead, ...section.items] : section.items
  return candidates.find((story) => !excluded.has(story.id)) ?? null
}

function orderSections(
  sectionsBySlug: Map<string, HomepageSection>,
  slugs: readonly string[],
): HomepageSection[] {
  return slugs
    .map((slug) => sectionsBySlug.get(slug))
    .filter((section): section is HomepageSection => Boolean(section))
}

function Section({ section, locale }: { section: HomepageSection; locale: Locale }) {
  return (
    <SectionBlock
      section={section}
      locale={locale}
      layout={SECTION_LAYOUT_BY_SLUG[section.category.slug] ?? 'news-desk'}
    />
  )
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
  // A single transient source flake must never blank the front page; retry
  // once before falling back to the service notice.
  const loadEdition = async () => {
    const first = await getHomepage().catch(() => null)
    if (first) return first
    await new Promise((resolve) => setTimeout(resolve, 300))
    return getHomepage().catch(() => null)
  }
  const [homepage, activePoll] = await Promise.all([
    loadEdition(),
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

  const populatedDesks = edition.sections.filter(
    (section) => Boolean(section.lead) || section.items.length > 0,
  )
  const sectionsBySlug = new Map<string, HomepageSection>(
    populatedDesks.map((section) => [section.category.slug, section]),
  )
  const diasporaSpotlight = sectionFeature(sectionsBySlug.get('diaspora'), frontPageIds)
  const photoExcluded = new Set(frontPageIds)
  if (diasporaSpotlight) photoExcluded.add(diasporaSpotlight.id)
  const photoSpotlight = sectionFeature(sectionsBySlug.get('photo-story'), photoExcluded)
  const spotlightIds = new Set<string>()
  if (diasporaSpotlight) spotlightIds.add(diasporaSpotlight.id)
  if (photoSpotlight) spotlightIds.add(photoSpotlight.id)

  const aboveFoldExclude = new Set<string>([
    ...frontPageIds,
    ...spotlightIds,
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

  const visibleDesks = populatedDesks.filter(
    (section) => !SPOTLIGHT_DESKS.has(section.category.slug),
  )
  const visibleBySlug = new Map<string, HomepageSection>(
    visibleDesks.map((section) => [section.category.slug, section]),
  )
  const coreDesks = orderSections(visibleBySlug, CORE_DESKS)
  const railedDesks = coreDesks.slice(0, 2)
  const fullWidthCoreDesks = coreDesks.slice(2)
  const featurePair = orderSections(visibleBySlug, FEATURE_PAIR)
  const signatureDesks = orderSections(visibleBySlug, SIGNATURE_DESKS)
  const reserved = new Set<string>([...CORE_DESKS, ...FEATURE_PAIR, ...SIGNATURE_DESKS])
  const secondaryDesks = visibleDesks.filter((section) => !reserved.has(section.category.slug))

  return (
    <div className="home-edition">
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pb-8 pt-2 sm:px-4 sm:pt-3 lg:pb-10">
        <PortalFeed stories={frontPageStories} locale={locale} />

        <HomeBillboardAd locale={locale} className="mt-6 sm:mt-8" />

        <EditorialSpotlight
          locale={locale}
          diaspora={diasporaSpotlight}
          photoStory={photoSpotlight}
        />

        {railedDesks.length > 0 ? (
          <div
            className={`mt-8 grid gap-7 sm:mt-10 ${
              latest.length > 0
                ? 'xl:grid-cols-[minmax(0,1fr)_minmax(17rem,19rem)] xl:items-start xl:gap-8'
                : ''
            }`}
          >
            <div className="min-w-0 space-y-8 sm:space-y-10">
              {railedDesks.map((section) => (
                <Section key={section.category.slug} section={section} locale={locale} />
              ))}
            </div>

            {latest.length > 0 ? (
              <aside className="hidden min-w-0 xl:block">
                <div className="sticky top-24">
                  <LatestRail
                    stories={latest}
                    locale={locale}
                    compact
                    headingId="latest-rail-title"
                  />
                </div>
              </aside>
            ) : null}
          </div>
        ) : null}

        {fullWidthCoreDesks.length > 0 ? (
          <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
            {fullWidthCoreDesks.map((section) => (
              <Section key={section.category.slug} section={section} locale={locale} />
            ))}
          </div>
        ) : null}

        {latest.length > 0 ? (
          <div className="mt-8 xl:hidden">
            <LatestRail
              stories={latest.slice(0, 6)}
              locale={locale}
              compact
              headingId="latest-mobile-title"
            />
          </div>
        ) : null}

        <div className="mt-8 sm:mt-10">
          <HomeMidAd locale={locale} />
        </div>

        <ProvinceHub locale={locale} stories={catalog} className="mt-8 sm:mt-10" />

        {featurePair.length > 0 ? (
          <div
            className={`mt-8 grid gap-8 sm:mt-10 ${
              featurePair.length > 1 ? 'lg:grid-cols-2 lg:gap-7' : ''
            }`}
          >
            {featurePair.map((section) => (
              <Section key={section.category.slug} section={section} locale={locale} />
            ))}
          </div>
        ) : null}

        {activePoll ? (
          <div className="mt-8 sm:mt-10">
            <PollOfDay locale={locale} poll={activePoll} />
          </div>
        ) : null}

        {signatureDesks.length > 0 ? (
          <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
            {signatureDesks.map((section) => (
              <Section key={section.category.slug} section={section} locale={locale} />
            ))}
          </div>
        ) : null}

        {secondaryDesks.length > 0 ? (
          <div
            className={`mt-8 grid gap-8 sm:mt-10 ${
              secondaryDesks.length > 1 ? 'md:grid-cols-2 md:gap-x-7 md:gap-y-10' : ''
            }`}
          >
            {secondaryDesks.map((section) => (
              <Section key={section.category.slug} section={section} locale={locale} />
            ))}
          </div>
        ) : null}

        <HomeClosingDesk
          locale={locale}
          historyStories={historyStories}
          historyMode="anniversary"
          photoOfDay={photoOfDay}
        />
      </div>
    </div>
  )
}
