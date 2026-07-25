import type { Metadata } from 'next'
import { Hero, StoryCard } from '@nagarikwatch/ui'
import { asLocale } from '@/lib/i18n/locales'
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
import { HomeLiveBoard } from '@/components/live/HomeLiveBoard'
import { UtilityStrip } from '@/components/live/UtilityStrip'
import { TodayInHistory } from '@/components/home/TodayInHistory'
import { PhotoOfTheDay } from '@/components/home/PhotoOfTheDay'
import Link from 'next/link'
import { localizeHref } from '@/lib/i18n/locales'

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
        Boolean(story.hasGallery) ||
        (Boolean(story.heroImage?.url) &&
          !story.heroImage!.url.startsWith('data:') &&
          (story.tags?.some((t) => t.slug === 'photo-story') ||
            story.category.slug === 'photos')),
    ) ||
    catalog.find(
      (story) =>
        Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:'),
    ) ||
    null

  return (
    <div>
      <ExperimentExposure experimentId={HOME_LAYOUT_EXPERIMENT_ID} />
      <BreakingTicker stories={edition.breaking} locale={locale} />

      <div className="mx-auto max-w-page px-3 pb-14 pt-3 sm:px-4 sm:pt-4 lg:pb-12">
        {/* Dense front page: lead + also-today rail */}
        <section
          className="grid gap-6 border-b-2 border-ink pb-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(16.5rem,0.7fr)] xl:gap-0 xl:pb-8"
          aria-label={english ? 'Front page' : 'मुख्य पृष्ठ'}
        >
          <InstrumentedStory
            articleSlug={edition.lead.slug}
            articleCategory={edition.lead.category.slug}
          >
            <Hero story={edition.lead} locale={locale} className="xl:pr-8" />
          </InstrumentedStory>

          <aside className="divide-y divide-rule border-y border-rule bg-surface-raised/60 xl:border-y-0 xl:border-l-2 xl:border-ink xl:bg-transparent xl:pl-5">
            <p
              className="pb-2.5 pt-2 text-caption font-extrabold uppercase tracking-[0.1em] text-brand-strong xl:pt-0"
              lang={english ? 'en' : 'ne'}
            >
              {english ? 'Also today' : 'आजका अन्य'}
            </p>
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
                  className={`py-3 first:pt-1.5 last:pb-0 ${index >= 5 ? 'hidden xl:block' : ''}`}
                />
              </InstrumentedStory>
            ))}
            <p className="py-3">
              <Link
                href={localizeHref(locale, '/latest')}
                className="inline-flex min-h-10 items-center text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
                lang={english ? 'en' : 'ne'}
              >
                {english ? 'Latest updates' : 'ताजा अपडेट'}
              </Link>
            </p>
          </aside>
        </section>

        <LatestRail stories={latest} locale={locale} className="mt-6 border-y-2 border-ink py-5" />

        <div className="mt-8 space-y-9 sm:mt-10 sm:space-y-11">
          {edition.sections.slice(0, 3).map((section, index) => (
            <SectionBlock
              key={section.category.slug}
              section={section}
              locale={locale}
              layout={sectionLayouts[index % sectionLayouts.length]}
            />
          ))}
        </div>

        <ProvinceHub locale={locale} className="mt-8 sm:mt-10" />

        {edition.sections.length > 3 ? (
          <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
            {edition.sections.slice(3).map((section, index) => (
              <SectionBlock
                key={section.category.slug}
                section={section}
                locale={locale}
                layout={sectionLayouts[(index + 3) % sectionLayouts.length]}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:gap-8">
          <TodayInBrief stories={briefPool} locale={locale} />
          {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
        </div>

        <UtilityStrip locale={locale} />
        <HomeLiveBoard locale={locale} className="mt-6" />

        <AdSlot
          locale={locale}
          placementKey="home-billboard"
          variant="billboard"
          className="mt-8"
        />

        <section className="mt-8 border-y border-rule py-5" aria-labelledby="home-newsletter">
          <div className="mx-auto max-w-xl">
            <h2 id="home-newsletter" className="sr-only" lang={english ? 'en' : 'ne'}>
              {english ? 'Newsletter' : 'न्युजलेटर'}
            </h2>
            <NewsletterInline locale={locale} />
          </div>
        </section>

        <RecommendedForYou locale={locale} catalog={catalog} className="mt-8" />

        <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-2 lg:gap-10">
          <TodayInHistory locale={locale} stories={historyStories} />
          <PhotoOfTheDay locale={locale} story={photoOfDay} />
        </div>

        <AdSlot locale={locale} placementKey="home-mid" variant="inline" className="mt-8" />
      </div>
    </div>
  )
}
