import type { Metadata } from 'next'
import { Suspense } from 'react'
import type { StoryCardData } from '@nagarikwatch/db'
import { RecommendedRailSkeleton } from '@nagarikwatch/ui'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'
import { asLocale } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories, getStories } from '@/lib/content'
import { dedupeHomepage } from '@/lib/content/homepage-dedup'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { LatestRail } from '@/components/home/LatestRail'
import { HomeEmptyEdition } from '@/components/home/HomeEmptyEdition'
import { ProvinceHub } from '@/components/home/ProvinceHub'
import { AdSlot } from '@/components/AdSlot'
import { RecommendedForYou } from '@/components/reader/RecommendedForYou'
import { PollOfDay } from '@/components/home/PollOfDay'
import { getActivePoll } from '@/lib/polls-admin'
import {
  HomeLayoutExperiment,
} from '@/components/experiments/HomeLayoutExperiment'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { NewsletterInline } from '@/components/NewsletterInline'
import { TodayInHistory } from '@/components/home/TodayInHistory'
import { PhotoOfTheDay } from '@/components/home/PhotoOfTheDay'
import { MostReadRail } from '@/components/home/MostReadRail'
import { FeaturedBand } from '@/components/home/FeaturedBand'
import {
  buildFeaturedBandPool,
  buildHomepageStream,
} from '@/lib/content/homepage-stream'
import { resolveHomeLayoutBandEvery } from '@/lib/experiments/home-layout'
import { resolveMostReadStories } from '@/lib/content/most-read-stories'
import { resolveProvinceHeat } from '@/lib/content/province-heat'

export const revalidate = 120

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
  const english = locale === 'en'
  const [homepage, activePoll, layout, storiesPage] = await Promise.all([
    getHomepage().catch(() => null),
    getActivePoll().catch(() => null),
    resolveHomeLayoutBandEvery().catch(() => ({ bandEvery: 3, variantId: null })),
    getStories({ locale, perPage: 24 }).catch(() => ({ items: [] as StoryCardData[], total: 0 })),
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
  ].filter((story): story is NonNullable<typeof story> => Boolean(story))

  // Broader corpus so most-read / trending / photo / recs are not limited to the edition only.
  const extraStories = storiesPage.items

  const catalog = Array.from(
    new Map([...editionStories, ...extraStories].map((story) => [story.id, story])).values(),
  )

  // Soft exclude for photo / for-you: only above-the-fold editorial, not every desk item.
  const aboveFoldExclude = new Set<string>([
    edition.lead.id,
    ...edition.featured.slice(0, 4).map((s) => s.id),
    ...edition.secondary.slice(0, 5).map((s) => s.id),
    ...edition.breaking.map((s) => s.id),
  ])

  // A1 portal feed: lead + featured + secondary, capped, then desks.
  const portalFeedIds = new Set<string>()
  const portalFeed: StoryCardData[] = []
  for (const story of [edition.lead, ...edition.featured, ...edition.secondary]) {
    if (!story || portalFeedIds.has(story.id)) continue
    portalFeedIds.add(story.id)
    portalFeed.push(story)
    if (portalFeed.length >= 5) break
  }
  const bandFeatured = buildFeaturedBandPool({
    featured: edition.featured,
    catalog,
    excludeIds: new Set([
      ...portalFeed.map((s) => s.id),
      ...edition.breaking.map((s) => s.id),
    ]),
  })
  const homepageStream = buildHomepageStream(edition.sections, bandFeatured, {
    bandEvery: layout.bandEvery,
    bandSize: 3,
    categoryAware: true,
  })

  // Freshness lens: full catalog by publishedAt (may include lead / featured).
  const latest = [...catalog]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 8)

  const [
    { stories: mostRead, live: mostReadLive },
    provinceHeat,
  ] = await Promise.all([
    resolveMostReadStories({
      catalog,
      excludeIds: new Set(),
      limit: 6,
      windowDays: 7,
      minLive: 2,
    }),
    resolveProvinceHeat({ catalog }).catch(() => []),
  ])

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

  const hasRealPhoto = (story: StoryCardData) =>
    Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')

  const photoOfDay =
    catalog.find(
      (story) =>
        !aboveFoldExclude.has(story.id) &&
        (Boolean(story.hasGallery) ||
          (hasRealPhoto(story) &&
            (story.tags?.some((t) => t.slug === 'photo-story') || story.category.slug === 'photos'))),
    ) ||
    catalog.find((story) => !aboveFoldExclude.has(story.id) && hasRealPhoto(story)) ||
    null

  const streamHead = homepageStream.slice(0, 2)
  const streamTail = homepageStream.slice(2)

  return (
    <div className="home-edition">
      <HomeLayoutExperiment />
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pt-3 sm:px-4 sm:pt-4">
        {/* A1 — centered mega-headline portal feed (OK / Ratopati / NepalKhabar grammar) */}
        <section
          className="space-y-8 border-b border-rule pb-6 sm:space-y-10 sm:pb-8"
          aria-label={english ? 'Front page' : 'मुख्य पृष्ठ'}
        >
          {portalFeed.map((story, index) => (
            <InstrumentedStory
              key={story.id}
              articleSlug={story.slug}
              articleCategory={story.category.slug}
            >
              <MegaStoryBlock story={story} locale={locale} priority={index === 0} />
            </InstrumentedStory>
          ))}
        </section>

        <AdSlot
          locale={locale}
          placementKey="home-top"
          variant="inline"
          className="mt-4"
        />

        {/*
          Portal packing: desks early on mobile (spine), then one lens,
          then remaining desks. Desktop: stream | sticky Latest (+ poll).
        */}
        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.38fr)] xl:items-start xl:gap-5">
          <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-1 xl:row-span-2">
            {streamHead.map((item) =>
              item.kind === 'section' ? (
                <SectionBlock key={item.section.category.slug} section={item.section} locale={locale} />
              ) : (
                <FeaturedBand
                  key={`featured-head-${item.stories.map((s) => s.id).join('-')}`}
                  stories={item.stories}
                  locale={locale}
                  variant="asymmetric"
                  categorySlug={item.categorySlug}
                />
              ),
            )}

            {/* Mobile: one recency rail after first desk band (not Latest + Most-read). */}
            <div className="xl:hidden">
              <LatestRail
                stories={latest.slice(0, 4)}
                locale={locale}
                headingId="latest-rail-title-mobile"
              />
            </div>

            {streamTail.map((item) =>
              item.kind === 'section' ? (
                <SectionBlock key={item.section.category.slug} section={item.section} locale={locale} />
              ) : (
                <FeaturedBand
                  key={`featured-tail-${item.stories.map((s) => s.id).join('-')}`}
                  stories={item.stories}
                  locale={locale}
                  variant="asymmetric"
                  categorySlug={item.categorySlug}
                />
              ),
            )}

            <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="pt-1" />

            <ProvinceHub locale={locale} heat={provinceHeat} />
          </div>

          <aside className="hidden min-w-0 space-y-5 xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:block">
            <div className="xl:sticky xl:top-24 xl:space-y-5">
              <LatestRail stories={latest} locale={locale} compact headingId="latest-rail-title" />
              <MostReadRail
                stories={mostRead}
                locale={locale}
                headingId="most-read-title"
                live={mostReadLive}
              />
              {activePoll ? (
                <PollOfDay locale={locale} poll={activePoll} headingId={`poll-${activePoll.id}-label`} />
              ) : null}
            </div>
          </aside>

          {activePoll ? (
            <div className="xl:hidden">
              <PollOfDay locale={locale} poll={activePoll} headingId={`poll-${activePoll.id}-label-mobile`} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-page px-3 pb-10 sm:px-4 lg:pb-12">
        <AdSlot
          locale={locale}
          placementKey="home-billboard"
          variant="billboard"
          className="mt-6"
        />

        <section
          className="mt-6 border border-rule bg-surface-raised px-4 py-4 sm:px-5 sm:py-5"
          aria-labelledby="home-newsletter"
        >
          <div className="mx-auto max-w-xl">
            <h2 id="home-newsletter" className="sr-only" lang={english ? 'en' : 'ne'}>
              {english ? 'Newsletter' : 'न्युजलेटर'}
            </h2>
            <NewsletterInline locale={locale} />
          </div>
        </section>

        <Suspense fallback={<RecommendedRailSkeleton className="mt-6" />}>
          <RecommendedForYou
            locale={locale}
            catalog={catalog}
            className="mt-6"
            excludeIds={aboveFoldExclude}
          />
        </Suspense>

        <div
          className={`mt-6 grid gap-5 border-t border-rule pt-5 ${photoOfDay ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-6' : ''}`}
        >
          <TodayInHistory locale={locale} stories={historyStories} mode={historyMode} />
          {photoOfDay ? <PhotoOfTheDay locale={locale} story={photoOfDay} /> : null}
        </div>
      </div>
    </div>
  )
}
