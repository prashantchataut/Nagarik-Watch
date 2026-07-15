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
    const wire = sourceHeadlines.slice(0, 6)
    const lead = wire[0]
    const rest = wire.slice(1)

    return (
      <div className="mx-auto max-w-page px-4 pb-16 pt-4">
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-rule bg-surface-raised px-3 py-2 text-caption font-bold uppercase tracking-[0.12em] text-brand-strong"
          lang={english ? 'en' : 'ne'}
        >
          <span>{english ? 'Coming online' : 'छिट्टै पूर्ण'}</span>
          <span className="text-mute" aria-hidden="true">
            ·
          </span>
          <span className="normal-case tracking-normal text-ink-soft">
            {english
              ? 'Editors are preparing the first published editions. Source wire and desks are live below.'
              : 'सम्पादकहरू पहिलो प्रकाशन तयार गर्दैछन्। तल वायर र विभाग उपलब्ध छन्।'}
          </span>
        </div>

        <section className="mt-6 grid gap-8 border-b border-rule pb-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.55fr)]">
          <div lang={english ? 'en' : 'ne'}>
            {lead ? (
              <>
                <p className="text-caption font-bold uppercase tracking-[0.16em] text-mute">
                  {english ? 'From the wire' : 'वायरबाट'}
                </p>
                <h1 className="mt-3 max-w-[22ch] font-display text-[clamp(1.9rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink">
                  <a
                    href={lead.sourceUrl || localizeHref(locale, '/wire')}
                    className="hover:text-brand-strong"
                    rel="noopener noreferrer"
                    target={lead.sourceUrl ? '_blank' : undefined}
                  >
                    {english && lead.titleEn ? lead.titleEn : lead.titleNe}
                  </a>
                </h1>
                <p className="mt-4 max-w-prose text-body leading-relaxed text-ink-soft">
                  {english
                    ? 'Open-source wire copy until the newsroom publishes reviewed stories. Desks and tips stay open.'
                    : 'सम्पादकीय समीक्षा पूरा भएको समाचार आउँदासम्म खुला वायर। विभाग र टिप खुला छन्।'}
                </p>
              </>
            ) : (
              <>
                <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong">
                  {english ? 'Nagarik Watch' : 'नागरिक वाच'}
                </p>
                <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2.1rem,5.5vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
                  {english ? 'Nepal news, province by province.' : 'हर प्रदेशका लागि नेपाली समाचार।'}
                </h1>
                <p className="mt-4 max-w-prose text-body leading-relaxed text-ink-soft">
                  {english
                    ? 'The newsroom is about to publish. Browse desks or send a tip while the first edition is prepared.'
                    : 'न्यूजरुम छिट्टै प्रकाशित गर्दैछ। पहिलो संस्करण तयार हुँदासम्म विभाग हेर्नुहोस् वा टिप पठाउनुहोस्।'}
                </p>
              </>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={localizeHref(locale, '/latest')}
                className="inline-flex min-h-11 items-center border border-brand bg-brand px-4 text-meta font-bold text-surface hover:bg-brand-strong"
              >
                {english ? 'Latest' : 'ताजा'}
              </Link>
              <Link
                href={localizeHref(locale, '/submit-story')}
                className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
              >
                {english ? 'Send a tip' : 'टिप पठाउनुहोस्'}
              </Link>
              <Link
                href={localizeHref(locale, '/about')}
                className="inline-flex min-h-11 items-center px-1 text-meta font-semibold text-ink-soft hover:text-brand-strong"
              >
                {english ? 'About us' : 'हाम्रो बारे'}
              </Link>
            </div>
          </div>

          <aside className="border-t border-rule pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-caption font-bold uppercase tracking-[0.14em] text-mute" lang={english ? 'en' : 'ne'}>
              {english ? 'Also on the wire' : 'अन्य वायर'}
            </p>
            <ol className="mt-2 divide-y divide-rule">
              {(rest.length ? rest : wire).slice(0, 5).map((item, index) => (
                <li key={item.sourceUrl || index} className="py-2.5">
                  <a
                    href={item.sourceUrl || localizeHref(locale, '/wire')}
                    className="group grid grid-cols-[1.25rem_1fr] gap-2"
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

        <section className="mt-10" aria-labelledby="desks-title">
          <div className="flex items-end justify-between gap-4 border-b border-ink pb-2">
            <h2 id="desks-title" className="font-display text-h1 text-ink" lang={english ? 'en' : 'ne'}>
              {english ? 'Sections' : 'विभाग'}
            </h2>
            <Link
              href={localizeHref(locale, '/sitemap')}
              className="text-meta font-bold text-ink-soft hover:text-brand-strong"
            >
              {english ? 'Full map' : 'पूर्ण नक्सा'}
            </Link>
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.slug} className="border-b border-rule">
                <Link
                  href={localizeHref(locale, `/${category.slug}`)}
                  className="group flex min-h-14 items-center justify-between gap-3 py-3"
                >
                  <span>
                    <strong className="font-display text-body-lg text-ink group-hover:text-brand-strong">
                      {english ? category.nameEn : category.nameNe}
                    </strong>
                    {(english ? category.descriptionEn : category.descriptionNe) ? (
                      <span className="mt-0.5 block text-caption leading-snug text-mute">
                        {english ? category.descriptionEn : category.descriptionNe}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-mute" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <SourceDeskPreview items={sourceHeadlines} locale={locale} />
        </div>
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
