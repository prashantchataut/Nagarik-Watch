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
      <div className="mx-auto max-w-page px-4 pb-16 pt-6">
        <section className="mt-2 grid gap-10 border-t-4 border-ink pt-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
          <div lang={english ? 'en' : 'ne'}>
            <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">
              {english ? 'Nagarik Watch' : 'नागरिक वाच'}
            </p>
            <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(2.4rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-ink">
              {english
                ? 'Independent reporting for every province.'
                : 'हर प्रदेशका लागि स्वतन्त्र समाचार।'}
            </h1>
            <p className="mt-5 max-w-body text-body-lg leading-relaxed text-ink-soft">
              {english
                ? 'The CMS has no reviewed stories live yet. Wire copy below is sourced open material — not invented homepage fiction — until editors publish.'
                : 'सम्पादकीय समीक्षा पूरा भएको समाचार अझै लाइभ छैन। तलको वायर खुला स्रोत सामग्री हो — काल्पनिक होमपेज होइन — सम्पादकले प्रकाशित गरेपछि मुख्य पृष्ठ भरिन्छ।'}
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href={localizeHref(locale, '/about')}
                className="inline-flex min-h-11 items-center border-b-2 border-brand font-bold text-ink hover:text-brand-strong"
              >
                {english ? 'How we work' : 'हामी कसरी काम गर्छौं'}
              </Link>
              <Link
                href={localizeHref(locale, '/submit-story')}
                className="inline-flex min-h-11 items-center border-b border-rule font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
              >
                {english ? 'Send a tip' : 'टिप पठाउनुहोस्'}
              </Link>
            </div>
          </div>
          <aside className="border-t border-rule pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-caption font-bold uppercase tracking-[0.14em] text-mute">
              {english ? 'On the wire' : 'वायरमा'}
            </p>
            <ol className="mt-3 divide-y divide-rule">
              {sourceHeadlines.slice(0, 5).map((item, index) => (
                <li key={item.sourceUrl || index} className="py-3">
                  <a
                    href={item.sourceUrl || localizeHref(locale, '/wire')}
                    className="group grid grid-cols-[1.5rem_1fr] gap-2"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="font-mono text-caption text-mute">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-meta font-semibold leading-snug text-ink group-hover:text-brand-strong">
                      {english && item.titleEn ? item.titleEn : item.titleNe}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>
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
