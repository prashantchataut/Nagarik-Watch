import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import type { StoryCardData } from '@nagarikwatch/db'
import { Hero } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories, getStories } from '@/lib/content'
import { dedupeHomepage } from '@/lib/content/homepage-dedup'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { TodayInBrief } from '@/components/home/TodayInBrief'
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
import { TrendingRail } from '@/components/home/TrendingRail'
import { FeaturedSpotlight } from '@/components/home/FeaturedSpotlight'
import { FeaturedBand } from '@/components/home/FeaturedBand'
import {
  buildFeaturedBandPool,
  buildHomepageStream,
} from '@/lib/content/homepage-stream'
import { resolveHomeLayoutBandEvery } from '@/lib/experiments/home-layout'
import { resolveMostReadStories } from '@/lib/content/most-read-stories'
import { resolveTrendingStories } from '@/lib/content/trending-stories'
import { resolveProvinceHeat } from '@/lib/content/province-heat'

export const dynamic = 'force-dynamic'
export const revalidate = 60

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
  const [homepage, activePoll, layout] = await Promise.all([
    getHomepage(),
    getActivePoll(),
    resolveHomeLayoutBandEvery(),
  ])

  if (!homepage) {
    const categories = await getNavCategories()
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
  const extraStories = await getStories({ locale, perPage: 80 })
    .then((page) => page.items)
    .catch(() => [] as StoryCardData[])

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

  const spotlightFeatured = edition.featured.slice(0, 4)
  const bandFeatured = buildFeaturedBandPool({
    featured: edition.featured,
    catalog,
    excludeIds: new Set([
      edition.lead.id,
      ...edition.secondary.map((s) => s.id),
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

  // Brief: chronological; soft-prefer non-lead for variety, still may overlap Latest.
  const briefPool = [...catalog]
    .filter((story) => story.id !== edition.lead.id)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 5)

  const [
    { stories: mostRead, live: mostReadLive },
    { stories: trending, live: trendingLive },
    provinceHeat,
  ] = await Promise.all([
    resolveMostReadStories({
      catalog,
      excludeIds: new Set(),
      limit: 6,
      windowDays: 7,
      minLive: 2,
    }),
    resolveTrendingStories({
      catalog,
      limit: 6,
      windowMinutes: 120,
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
        <section
          className="grid gap-4 border-b border-rule pb-4 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.38fr)] xl:items-start xl:gap-5 xl:pb-5"
          aria-label={english ? 'Front page' : 'मुख्य पृष्ठ'}
        >
          <InstrumentedStory
            articleSlug={edition.lead.slug}
            articleCategory={edition.lead.category.slug}
          >
            <Hero story={edition.lead} locale={locale} />
          </InstrumentedStory>

          <aside className="min-w-0 xl:border-l xl:border-rule xl:pl-5">
            <div className="mb-2.5">
              <p
                className="text-meta font-extrabold text-brand-strong"
                lang={english ? 'en' : 'ne'}
              >
                {english ? 'Also today' : 'आजका अन्य'}
              </p>
              <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            </div>
            <div className="divide-y divide-rule border-y border-rule">
              {edition.secondary.slice(0, 5).map((story, index) => (
                <InstrumentedStory
                  key={story.id}
                  articleSlug={story.slug}
                  articleCategory={story.category.slug}
                >
                  <DenseStoryItem
                    story={story}
                    locale={locale}
                    showDeck={false}
                    className={`py-3 xl:py-2.5 ${index >= 4 ? 'xl:hidden' : ''}`}
                  />
                </InstrumentedStory>
              ))}
            </div>
            <p className="pt-2 xl:pt-1.5">
              <Link
                href={localizeHref(locale, '/latest')}
                className="inline-flex min-h-9 items-center rounded-md text-meta font-bold text-brand-strong underline-offset-4 hover:underline xl:text-caption"
                lang={english ? 'en' : 'ne'}
              >
                {english ? 'Latest updates' : 'ताजा अपडेट'}
              </Link>
            </p>
          </aside>
        </section>

        <AdSlot
          locale={locale}
          placementKey="home-top"
          variant="inline"
          className="mt-4"
        />

        <FeaturedSpotlight stories={spotlightFeatured} locale={locale} className="mt-4" />

        {/*
          Portal packing: desks early on mobile (spine), then lens stack,
          then remaining desks. Desktop: stream | sticky lenses (Latest + Brief + Most-read + Trending).
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
                  variant={item.variant === 'trio' ? 'asymmetric' : item.variant}
                  categorySlug={item.categorySlug}
                />
              ),
            )}

            <div className="space-y-5 xl:hidden">
              <LatestRail stories={latest} locale={locale} headingId="latest-rail-title-mobile" />
              <TodayInBrief stories={briefPool} locale={locale} headingId="today-in-brief-mobile" />
              <MostReadRail
                stories={mostRead}
                locale={locale}
                headingId="most-read-title-mobile"
                live={mostReadLive}
              />
              <TrendingRail
                stories={trending}
                locale={locale}
                headingId="trending-rail-title-mobile"
                live={trendingLive}
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
                  variant={item.variant === 'trio' ? 'asymmetric' : item.variant}
                  categorySlug={item.categorySlug}
                />
              ),
            )}

            <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="pt-1" />

            <ProvinceHub locale={locale} heat={provinceHeat} />
          </div>

          <aside className="hidden min-w-0 space-y-5 xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:block">
            <div className="xl:sticky xl:top-28 xl:space-y-5">
              <LatestRail stories={latest} locale={locale} compact headingId="latest-rail-title" />
              <TodayInBrief stories={briefPool} locale={locale} headingId="today-in-brief" />
              <MostReadRail
                stories={mostRead}
                locale={locale}
                headingId="most-read-title"
                live={mostReadLive}
              />
              <TrendingRail
                stories={trending}
                locale={locale}
                headingId="trending-rail-title"
                live={trendingLive}
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

        <Suspense fallback={null}>
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
