import Link from 'next/link'
import { Hero, StoryCard } from '@nagarikwatch/ui'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getHomepage, getNavCategories } from '@/lib/content'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { TodayInBrief } from '@/components/home/TodayInBrief'
import { LatestRail } from '@/components/home/LatestRail'
import { AdSlot } from '@/components/AdSlot'
import { RecommendedForYou } from '@/components/reader/RecommendedForYou'
import { PollOfDay } from '@/components/home/PollOfDay'
import { getActivePoll } from '@/lib/polls-admin'
import { getSourceDeskHeadlines } from '@/lib/source-desk'
import { SourceDeskPreview } from '@/components/home/SourceDeskPreview'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const [homepage, categories, activePoll, sourceHeadlines] = await Promise.all([
    getHomepage(),
    getNavCategories(),
    getActivePoll(),
    getSourceDeskHeadlines(8),
  ])

  if (!homepage) {
    return (
      <div className="mx-auto max-w-page px-4 py-16">
        <section className="max-w-3xl border-y border-rule py-10" lang={english ? 'en' : 'ne'}>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">
            {english ? 'Newsroom status' : 'न्युजरुम अवस्था'}
          </p>
          <h1 className="mt-3 font-display text-display leading-tight text-ink">
            {english
              ? 'No reviewed stories have been published yet.'
              : 'सम्पादकीय समीक्षा पूरा भएको समाचार अझै प्रकाशित छैन।'}
          </h1>
          <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft">
            {english
              ? 'This page stays empty rather than presenting invented headlines. Published CMS stories will appear here automatically.'
              : 'काल्पनिक शीर्षक देखाउनुको सट्टा यो पृष्ठ खाली राखिएको छ। CMS बाट प्रकाशित समाचार यहाँ स्वतः देखिन्छन्।'}
          </p>
          <Link
            href={localizeHref(locale, '/about')}
            className="mt-6 inline-flex min-h-11 items-center border-b-2 border-brand font-bold text-ink hover:text-brand-strong"
          >
            {english ? 'How Nagarik Watch works' : 'नागरिक वाच कसरी काम गर्छ'}
          </Link>
        </section>
        <div className="mt-12">
          <SourceDeskPreview items={sourceHeadlines} locale={locale} />
        </div>
        <section className="mt-12" aria-labelledby="desks-title">
          <h2 id="desks-title" className="font-display text-h1 text-ink">
            {english ? 'News desks' : 'समाचार विभाग'}
          </h2>
          <div className="mt-5 grid gap-x-8 gap-y-5 border-t border-rule pt-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={localizeHref(locale, `/${category.slug}`)}
                className="group border-b border-rule pb-4"
              >
                <strong className="font-display text-h2 text-ink group-hover:text-brand-strong">
                  {english ? category.nameEn : category.nameNe}
                </strong>
                {(english ? category.descriptionEn : category.descriptionNe) ? (
                  <span className="mt-1 block text-meta leading-relaxed text-ink-soft">
                    {english ? category.descriptionEn : category.descriptionNe}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      </div>
    )
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

  return (
    <div>
      <BreakingTicker stories={homepage.breaking} locale={locale} />
      <div className="mx-auto max-w-page px-4 py-6 sm:py-9">
        <section className="grid gap-8 border-b border-rule pb-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.62fr)_minmax(16rem,0.52fr)]">
          <Hero story={homepage.lead} locale={locale} />
          <div className="divide-y divide-rule border-y border-rule xl:border-y-0 xl:border-l xl:pl-7">
            {homepage.secondary.slice(0, 4).map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                locale={locale}
                variant="horizontal"
                className="py-4 first:pt-0 last:pb-0"
              />
            ))}
          </div>
          <LatestRail stories={latest} locale={locale} className="xl:border-l xl:pl-7" />
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
          <TodayInBrief stories={homepage.secondary} locale={locale} />
          {activePoll ? <PollOfDay locale={locale} poll={activePoll} /> : null}
        </div>

        <AdSlot locale={locale} placementKey="home-billboard" variant="billboard" />
        <RecommendedForYou locale={locale} catalog={catalog} className="mt-12" />

        <div className="mt-12 space-y-16">
          {homepage.sections.map((section, index) => (
            <SectionBlock
              key={section.category.slug}
              section={section}
              locale={locale}
              layout={index % 3 === 0 ? 'lead-rail' : index % 3 === 1 ? 'default-grid' : 'text-led'}
            />
          ))}
        </div>
        <div className="mt-16">
          <SourceDeskPreview items={sourceHeadlines} locale={locale} />
        </div>
        <AdSlot locale={locale} placementKey="home-mid" variant="inline" />
      </div>
    </div>
  )
}
