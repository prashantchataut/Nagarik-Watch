import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import type { StoryCardData } from '@nagarikwatch/db'
import { Hero } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories } from '@/lib/content'
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
  ExperimentExposure,
  HOME_LAYOUT_EXPERIMENT_ID,
} from '@/components/experiments/ExperimentExposure'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { NewsletterInline } from '@/components/NewsletterInline'
import { TodayInHistory } from '@/components/home/TodayInHistory'
import { PhotoOfTheDay } from '@/components/home/PhotoOfTheDay'
import { MostReadRail } from '@/components/home/MostReadRail'
import { FeaturedSpotlight } from '@/components/home/FeaturedSpotlight'
import { FeaturedBand } from '@/components/home/FeaturedBand'
import { buildHomepageStream } from '@/lib/content/homepage-stream'

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
  const [homepage, activePoll] = await Promise.all([getHomepage(), getActivePoll()])

  if (!homepage) {
    const categories = await getNavCategories()
    return <HomeEmptyEdition locale={locale} categories={categories} />
  }

  const edition = dedupeHomepage(homepage)

  const catalog = Array.from(
    new Map(
      [
        edition.lead,
        ...edition.featured,
        ...edition.secondary,
        ...edition.breaking,
        ...edition.sections.flatMap((section) => [section.lead, ...section.items]),
      ]
        .filter((story): story is NonNullable<typeof story> => Boolean(story))
        .map((story) => [story.id, story]),
    ).values(),
  )

  const spotlightFeatured = edition.featured.slice(0, 4)
  const bandFeatured = edition.featured.slice(4)
  const homepageStream = buildHomepageStream(edition.sections, bandFeatured)

  const latest = [...catalog]
    .filter((story) => story.id !== edition.lead.id)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  const secondaryIds = new Set(homepage.secondary.map((s) => s.id))
  const briefStories = latest.filter((s) => !secondaryIds.has(s.id)).slice(0, 5)
  const briefPool = briefStories.length >= 3 ? briefStories : latest.slice(0, 5)

  const mostRead = latest.filter((s) => !secondaryIds.has(s.id)).slice(0, 6)

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

  const usedAbove = new Set<string>([
    edition.lead.id,
    ...edition.featured.map((s) => s.id),
    ...edition.secondary.map((s) => s.id),
    ...edition.breaking.map((s) => s.id),
  ])

  const hasRealPhoto = (story: StoryCardData) =>
    Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')

  const photoOfDay =
    catalog.find(
      (story) =>
        !usedAbove.has(story.id) &&
        (Boolean(story.hasGallery) ||
          (hasRealPhoto(story) &&
            (story.tags?.some((t) => t.slug === 'photo-story') || story.category.slug === 'photos'))),
    ) ||
    catalog.find((story) => !usedAbove.has(story.id) && hasRealPhoto(story)) ||
    null

  return (
    <div className="home-edition">
      <ExperimentExposure experimentId={HOME_LAYOUT_EXPERIMENT_ID} />
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pt-3 sm:px-4 sm:pt-4">
        <AdSlot
          locale={locale}
          placementKey="home-top"
          variant="inline"
          className="mb-4"
        />

        {/* Front page: lead + also-today — match main grid ratios so the rail does not tower over a short lead. */}
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

        <FeaturedSpotlight stories={spotlightFeatured} locale={locale} className="mt-4" />

        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.38fr)] xl:items-start xl:gap-5">
          <div className="min-w-0 space-y-5">
            {homepageStream.map((item) =>
              item.kind === 'section' ? (
                <SectionBlock key={item.section.category.slug} section={item.section} locale={locale} />
              ) : (
                <FeaturedBand
                  key={`featured-${item.stories.map((s) => s.id).join('-')}`}
                  stories={item.stories}
                  locale={locale}
                  variant={item.variant}
                />
              ),
            )}

            <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="pt-1" />

            <ProvinceHub locale={locale} />
          </div>

          <aside className="hidden min-w-0 xl:block">
            <div className="sticky top-28 space-y-5">
              <LatestRail stories={latest} locale={locale} compact />
              <TodayInBrief stories={briefPool} locale={locale} />
              <MostReadRail stories={mostRead} locale={locale} />
              {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
            </div>
          </aside>
        </div>

        <LatestRail
          stories={latest}
          locale={locale}
          className="mt-5 border-y border-rule py-4 xl:hidden"
        />

        <div className="mt-5 grid gap-5 border-t border-rule pt-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:gap-6 xl:hidden">
          <TodayInBrief stories={briefPool} locale={locale} />
          <div className="space-y-6">
            <MostReadRail stories={mostRead} locale={locale} />
            {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
          </div>
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
            excludeIds={usedAbove}
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
