import type { Metadata } from 'next'
import { Hero, StoryCard } from '@nagarikwatch/ui'
import { asLocale } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories } from '@/lib/content'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { TodayInBrief } from '@/components/home/TodayInBrief'
import { LatestRail } from '@/components/home/LatestRail'
import { HomeDeskRail } from '@/components/home/HomeDeskRail'
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
import { HomeLiveBoard } from '@/components/live/HomeLiveBoard'
import { UtilityStrip } from '@/components/live/UtilityStrip'
import { TodayInHistory } from '@/components/home/TodayInHistory'
import { PhotoOfTheDay } from '@/components/home/PhotoOfTheDay'

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
  const [homepage, categories, activePoll] = await Promise.all([
    getHomepage(),
    getNavCategories(),
    getActivePoll(),
  ])

  if (!homepage) {
    return <HomeEmptyEdition locale={locale} categories={categories} />
  }

  const catalog = Array.from(
    new Map(
      [
        homepage.lead,
        ...homepage.secondary,
        ...homepage.breaking,
        ...homepage.sections.flatMap((section) => [section.lead, ...section.items]),
      ]
        .filter((story): story is NonNullable<typeof story> => Boolean(story))
        .map((story) => [story.id, story]),
    ).values(),
  )

  const latest = [...catalog]
    .filter((story) => story.id !== homepage.lead.id)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  const secondaryIds = new Set(homepage.secondary.map((s) => s.id))
  const briefStories = latest.filter((s) => !secondaryIds.has(s.id)).slice(0, 5)
  const briefPool = briefStories.length >= 3 ? briefStories : latest.slice(0, 5)

  const sectionLayouts = ['lead-rail', 'text-led', 'overlay-grid'] as const

  const today = new Date()
  const monthDay = `${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`
  const historyStories = catalog
    .filter((story) => {
      const published = new Date(story.publishedAt)
      if (Number.isNaN(published.getTime())) return false
      if (published.getUTCFullYear() >= today.getUTCFullYear()) return false
      const md = `${String(published.getUTCMonth() + 1).padStart(2, '0')}-${String(published.getUTCDate()).padStart(2, '0')}`
      return md === monthDay
    })
    .slice(0, 4)
  const photoOfDay =
    catalog.find(
      (story) =>
        Boolean(story.heroImage?.url) &&
        !story.heroImage!.url.startsWith('data:') &&
        (story.category.slug === 'photo-story' ||
          story.category.slug === 'photos' ||
          /photo|फोटो|gallery|ग्याल/i.test(`${story.titleNe} ${story.titleEn || ''}`)),
    ) || null

  return (
    <div>
      <ExperimentExposure experimentId={HOME_LAYOUT_EXPERIMENT_ID} />
      <UtilityStrip locale={locale} />
      <BreakingTicker stories={homepage.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-4 pt-3 sm:pt-4">
        <HomeDeskRail locale={locale} categories={categories} />
      </div>

      <div className="mx-auto max-w-page px-4 pb-16 pt-6 sm:pt-9">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
          <div>
            <p
              className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong"
              lang="en"
              translate="no"
            >
              Today&apos;s edition
            </p>
            <h2 className="sr-only" lang={english ? 'en' : 'ne'}>
              {english ? 'Lead stories' : 'मुख्य समाचार'}
            </h2>
          </div>
          <p className="text-meta text-mute" lang={english ? 'en' : 'ne'}>
            {english
              ? 'Original reporting from the Nagarik Watch newsroom'
              : 'नागरिक वाच न्यूजरुमबाट मौलिक रिपोर्टिङ'}
          </p>
        </header>

        <section
          className="grid gap-8 border-b border-rule pb-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.58fr)_minmax(15rem,0.5fr)]"
          aria-label={english ? 'Front page' : 'मुख्य पृष्ठ'}
        >
          <InstrumentedStory
            articleSlug={homepage.lead.slug}
            articleCategory={homepage.lead.category.slug}
          >
            <Hero story={homepage.lead} locale={locale} />
          </InstrumentedStory>

          <div className="divide-y divide-rule border-y border-rule xl:border-y-0 xl:border-l xl:pl-7">
            <p
              className="pb-3 pt-1 text-caption font-bold uppercase tracking-[0.14em] text-ink-soft xl:pt-0"
              lang={english ? 'en' : 'ne'}
            >
              {english ? 'Also today' : 'आजका अन्य'}
            </p>
            {homepage.secondary.slice(0, 4).map((story) => (
              <InstrumentedStory
                key={story.id}
                articleSlug={story.slug}
                articleCategory={story.category.slug}
              >
                <StoryCard
                  story={story}
                  locale={locale}
                  variant="horizontal"
                  className="py-4 first:pt-1 last:pb-0"
                />
              </InstrumentedStory>
            ))}
          </div>

          <LatestRail stories={latest} locale={locale} className="xl:border-l xl:pl-7" />
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <TodayInBrief stories={briefPool} locale={locale} />
          {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
        </div>

        <HomeLiveBoard locale={locale} className="mt-10 lg:hidden" />

        <AdSlot
          locale={locale}
          placementKey="home-billboard"
          variant="billboard"
          className="mt-12"
        />

        <section
          className="mt-12 border-y border-rule bg-brand-tint/35 px-4 py-8 sm:px-6"
          aria-labelledby="home-newsletter"
        >
          <div className="mx-auto max-w-xl">
            <h2
              id="home-newsletter"
              className="sr-only"
              lang={english ? 'en' : 'ne'}
            >
              {english ? 'Newsletter' : 'न्युजलेटर'}
            </h2>
            <NewsletterInline locale={locale} />
          </div>
        </section>

        <RecommendedForYou locale={locale} catalog={catalog} className="mt-12" />

        <div className="mt-14 space-y-16 sm:space-y-20">
          {homepage.sections.map((section, index) => (
            <SectionBlock
              key={section.category.slug}
              section={section}
              locale={locale}
              layout={sectionLayouts[index % sectionLayouts.length]}
            />
          ))}
        </div>

        <ProvinceHub locale={locale} className="mt-16" />

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <TodayInHistory locale={locale} stories={historyStories} />
          <PhotoOfTheDay locale={locale} story={photoOfDay} />
        </div>

        <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="mt-14" />
      </div>
    </div>
  )
}
