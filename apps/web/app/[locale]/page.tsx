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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const [homepage, categories, activePoll] = await Promise.all([
    getHomepage(),
    getNavCategories(),
    getActivePoll(),
  ])

  if (!homepage) {
    const serviceLinks = [
      { href: '/latest', titleNe: 'ताजा', titleEn: 'Latest' },
      { href: '/trending', titleNe: 'ट्रेन्डिङ', titleEn: 'Trending' },
      { href: '/most-read', titleNe: 'धेरै पढिएको', titleEn: 'Most read' },
      { href: '/market', titleNe: 'बजार', titleEn: 'Market' },
      { href: '/utilities', titleNe: 'उपयोगी', titleEn: 'Utilities' },
      { href: '/rashifal', titleNe: 'राशिफल', titleEn: 'Rashifal' },
      { href: '/fact-check', titleNe: 'तथ्य-जाँच', titleEn: 'Fact check' },
      { href: '/submit-story', titleNe: 'टिप पठाउनुहोस्', titleEn: 'Send a tip' },
    ]

    return (
      <div className="mx-auto max-w-page px-4 pb-16 pt-3">
        <nav
          aria-label={english ? 'Quick desks' : 'द्रुत विभाग'}
          className="overflow-x-auto border-y border-rule bg-surface-raised [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex min-w-max divide-x divide-rule">
            {serviceLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={localizeHref(locale, item.href)}
                  className="inline-flex min-h-11 items-center whitespace-nowrap px-3.5 text-meta font-bold text-ink-soft hover:bg-surface hover:text-brand-strong"
                  lang={english ? 'en' : 'ne'}
                >
                  {english ? item.titleEn : item.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mt-8 border-b-2 border-ink pb-10" lang={english ? 'en' : 'ne'}>
          <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong">Nagarik Watch</p>
          <h1 className="mt-2 max-w-[18ch] font-display text-[clamp(2rem,5.2vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
            {english ? 'Original reporting from our newsroom.' : 'हाम्रो न्यूजरुमको मौलिक रिपोर्टिङ।'}
          </h1>
          <p className="mt-3 max-w-prose text-body leading-relaxed text-ink-soft">
            {english
              ? 'We publish original Nagarik Watch stories only — no outbound scrapes to other news sites. Editors can add and edit articles from the newsroom admin.'
              : 'हामी मौलिक नागरिक वाच समाचार मात्र प्रकाशित गर्छौं — अन्य साइटका स्क्र्याप लिंक छैनन्। सम्पादकले एडमिनबाट लेख थप्न/सच्याउन सक्छन्।'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={localizeHref(locale, '/latest')}
              className="inline-flex min-h-11 items-center bg-brand px-4 text-meta font-bold text-surface hover:bg-brand-strong"
            >
              {english ? 'Latest' : 'ताजा'}
            </Link>
            <Link
              href={localizeHref(locale, '/submit-story')}
              className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
            >
              {english ? 'Send a tip' : 'टिप पठाउनुहोस्'}
            </Link>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="desks-title">
          <div className="flex items-end justify-between gap-4 border-b border-ink pb-2">
            <h2 id="desks-title" className="font-display text-h1 text-ink" lang={english ? 'en' : 'ne'}>
              {english ? 'News desks' : 'समाचार विभाग'}
            </h2>
          </div>
          <ul className="mt-2 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {categories.map((category) => (
              <li key={category.slug} className="break-inside-avoid border-b border-rule">
                <Link
                  href={localizeHref(locale, `/${category.slug}`)}
                  className="group flex min-h-12 items-center justify-between gap-3 py-2.5"
                >
                  <strong className="font-display text-body-lg text-ink group-hover:text-brand-strong">
                    {english ? category.nameEn : category.nameNe}
                  </strong>
                  <span className="text-mute" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
        <AdSlot locale={locale} placementKey="home-mid" variant="inline" />
      </div>
    </div>
  )
}
