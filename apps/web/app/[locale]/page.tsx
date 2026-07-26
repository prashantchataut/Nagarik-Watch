import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Hero, StoryCard } from '@nagarikwatch/ui'
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
        ...edition.secondary,
        ...edition.breaking,
        ...edition.sections.flatMap((section) => [section.lead, ...section.items]),
      ]
        .filter((story): story is NonNullable<typeof story> => Boolean(story))
        .map((story) => [story.id, story]),
    ).values(),
  )

  const latest = [...catalog]
    .filter((story) => story.id !== edition.lead.id)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  const secondaryIds = new Set(homepage.secondary.map((s) => s.id))
  const briefStories = latest.filter((s) => !secondaryIds.has(s.id)).slice(0, 5)
  const briefPool = briefStories.length >= 3 ? briefStories : latest.slice(0, 5)

  const mostRead = latest.filter((s) => !secondaryIds.has(s.id)).slice(0, 6)

  const sectionLayouts = ['desk', 'stack', 'mosaic'] as const

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
        Boolean(story.hasGallery) ||
        (Boolean(story.heroImage?.url) &&
          (story.tags?.some((t) => t.slug === 'photo-story') || story.category.slug === 'photos')),
    ) ||
    catalog.find((story) => Boolean(story.heroImage?.url)) ||
    edition.lead

  const topSections = edition.sections.slice(0, 3)
  const moreSections = edition.sections.slice(3)

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

        {/* Front page: lead + also-today */}
        <section
          className="grid gap-5 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(17rem,0.75fr)] xl:items-start xl:gap-6 xl:pb-6"
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
              {edition.secondary.slice(0, 6).map((story, index) => (
                <InstrumentedStory
                  key={story.id}
                  articleSlug={story.slug}
                  articleCategory={story.category.slug}
                >
                  <StoryCard
                    story={story}
                    locale={locale}
                    variant="horizontal"
                    className={`py-3 ${index >= 5 ? 'hidden xl:block' : ''}`}
                  />
                </InstrumentedStory>
              ))}
            </div>
            <p className="pt-3">
              <Link
                href={localizeHref(locale, '/latest')}
                className="inline-flex min-h-10 items-center rounded-md text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
                lang={english ? 'en' : 'ne'}
              >
                {english ? 'Latest updates' : 'ताजा अपडेट'}
              </Link>
            </p>
          </aside>
        </section>

        <LatestRail stories={latest} locale={locale} className="mt-5 border-b border-rule pb-5" />

        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)] xl:items-start xl:gap-6">
          <div className="min-w-0 space-y-6 sm:space-y-7">
            {topSections.map((section, index) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={sectionLayouts[index % sectionLayouts.length]}
              />
            ))}
          </div>
          <aside className="hidden min-w-0 xl:block">
            <div className="sticky top-28 space-y-6">
              <TodayInBrief stories={briefPool} locale={locale} />
              <MostReadRail stories={mostRead} locale={locale} />
              {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
            </div>
          </aside>
        </div>

        <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="mt-6" />

        <ProvinceHub locale={locale} className="mt-6 sm:mt-7" />

        {moreSections.length ? (
          <div className="mt-6 space-y-6 sm:mt-7 sm:space-y-7">
            {moreSections.map((section, index) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={sectionLayouts[(index + 1) % sectionLayouts.length]}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 border-t border-rule pt-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:gap-8 xl:hidden">
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
          <RecommendedForYou locale={locale} catalog={catalog} className="mt-6" />
        </Suspense>

        <div className="mt-6 grid gap-6 border-t border-rule pt-6 lg:grid-cols-2 lg:gap-8">
          <TodayInHistory locale={locale} stories={historyStories} mode={historyMode} />
          <PhotoOfTheDay locale={locale} story={photoOfDay} />
        </div>
      </div>
    </div>
  )
}
