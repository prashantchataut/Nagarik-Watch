import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Hero } from '@nagarikwatch/ui'
import { PROVINCES } from '@/lib/site'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type ProvinceMeta = (typeof PROVINCES)[number]

type ProvinceDeskProps = {
  locale: Locale
  province: ProvinceMeta
  stories: StoryCardData[]
  /** National latest when this province desk is still empty. */
  nationalFallback?: StoryCardData[]
}

export function ProvinceDesk({
  locale,
  province,
  stories,
  nationalFallback = [],
}: ProvinceDeskProps) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const title = en ? province.nameEn : province.nameNe
  const lead = en
    ? `Local reporting and public-interest updates from ${province.nameEn} Province.`
    : `${province.nameNe} प्रदेशका स्थानीय रिपोर्टिङ र सार्वजनिक चासोका अपडेट।`

  const leadStory = stories[0]
  const sideStories = stories.slice(1, 5)
  const moreStories = stories.slice(5)

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader title={title} lead={lead} lang={lang} />

      <ProvinceSwitcher locale={locale} activeSlug={province.slug} />

      {leadStory ? (
        <section
          className="mt-4 grid gap-4 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.75fr)] xl:items-start xl:gap-5"
          aria-label={en ? 'Province lead' : 'प्रदेश मुख्य'}
        >
          <InstrumentedStory
            articleSlug={leadStory.slug}
            articleCategory={leadStory.category.slug}
          >
            <Hero story={leadStory} locale={locale} />
          </InstrumentedStory>
          {sideStories.length > 0 ? (
            <aside className="min-w-0 xl:border-l xl:border-rule xl:pl-5">
              <p className="text-meta font-extrabold text-brand-strong" lang={lang}>
                {en ? 'Also from this province' : 'यस प्रदेशका अन्य'}
              </p>
              <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden />
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {sideStories.map((story) => (
                  <li key={story.slug} className="py-2.5">
                    <InstrumentedStory
                      articleSlug={story.slug}
                      articleCategory={story.category.slug}
                    >
                      <DenseStoryItem story={story} locale={locale} showDeck={false} thumb="sm" />
                    </InstrumentedStory>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </section>
      ) : (
        <ProvinceEmpty
          locale={locale}
          province={province}
          nationalFallback={nationalFallback}
        />
      )}

      {moreStories.length > 0 ? (
        <section className="mt-5">
          <div className="border-b border-rule pb-2">
            <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
              {en ? 'More coverage' : 'थप सामग्री'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden />
          </div>
          <ul className="mt-2 divide-y divide-rule">
            {moreStories.map((story) => (
              <li key={story.slug} className="py-2.5">
                <InstrumentedStory
                  articleSlug={story.slug}
                  articleCategory={story.category.slug}
                >
                  <DenseStoryItem story={story} locale={locale} thumb="md" />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function ProvinceSwitcher({
  locale,
  activeSlug,
}: {
  locale: Locale
  activeSlug: string
}) {
  const en = locale === 'en'
  return (
    <nav
      className="mt-5 border-y border-rule py-3"
      aria-label={en ? 'All provinces' : 'सबै प्रदेश'}
    >
      <ul className="flex flex-wrap gap-1.5">
        <li>
          <Link
            href={localizeHref(locale, '/province')}
            className="inline-flex min-h-9 items-center border border-rule px-2.5 text-caption font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
            lang={en ? 'en' : 'ne'}
          >
            {en ? 'All' : 'सबै'}
          </Link>
        </li>
        {PROVINCES.map((p) => {
          const active = p.slug === activeSlug
          return (
            <li key={p.slug}>
              <Link
                href={localizeHref(locale, `/province/${p.slug}`)}
                className={
                  active
                    ? 'inline-flex min-h-9 items-center border border-brand bg-brand px-2.5 text-caption font-bold text-paper'
                    : 'inline-flex min-h-9 items-center border border-rule px-2.5 text-caption font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong'
                }
                lang={en ? 'en' : 'ne'}
                aria-current={active ? 'page' : undefined}
              >
                {en ? p.nameEn : p.nameNe}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function ProvinceEmpty({
  locale,
  province,
  nationalFallback,
}: {
  locale: Locale
  province: ProvinceMeta
  nationalFallback: StoryCardData[]
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const name = en ? province.nameEn : province.nameNe

  return (
    <section className="mt-6" lang={lang}>
      <div className="border border-rule bg-surface-raised px-4 py-5 sm:px-5">
        <p className="font-display text-body-lg font-extrabold text-ink">
          {en
            ? `No ${name}-tagged stories yet`
            : `${name} ट्याग भएका समाचार अझै छैनन्`}
        </p>
        <p className="mt-2 max-w-body text-meta leading-relaxed text-ink-soft">
          {en
            ? 'When reporters file with a province desk tag, stories appear here. Browse other provinces or the national latest below.'
            : 'पत्रकारले प्रदेश डेस्क ट्याग गरेपछि सामग्री यहाँ आउँछ। अन्य प्रदेश वा तलको राष्ट्रिय ताजा हेर्नुहोस्।'}
        </p>
      </div>

      {nationalFallback.length > 0 ? (
        <div className="mt-8">
          <div className="border-b border-rule pb-3">
            <h2 className="font-display text-h3 font-extrabold text-ink">
              {en ? 'From the national desk' : 'राष्ट्रिय डेस्कबाट'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden />
          </div>
          <ul className="mt-4 divide-y divide-rule border-y border-rule sm:grid sm:grid-cols-2 sm:divide-y-0">
            {nationalFallback.slice(0, 6).map((story) => (
              <li key={story.slug} className="py-3 sm:border-b sm:border-rule sm:px-2">
                <InstrumentedStory
                  articleSlug={story.slug}
                  articleCategory={story.category.slug}
                >
                  <DenseStoryItem story={story} locale={locale} thumb="sm" showDeck={false} />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link
              href={localizeHref(locale, '/latest')}
              className="text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
            >
              {en ? 'All latest' : 'सबै ताजा'}
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  )
}

export function ProvinceIndex({
  locale,
  counts,
  recent,
}: {
  locale: Locale
  counts: Record<string, number>
  recent: StoryCardData[]
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <HubIndexHeader
        title={en ? 'Provinces' : 'प्रदेश'}
        lead={
          en
            ? 'Seven provincial desks for local reporting across Nepal.'
            : 'नेपालभरिका स्थानीय रिपोर्टिङका लागि सात प्रदेश डेस्क।'
        }
        lang={lang}
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PROVINCES.map((p) => {
          const count = counts[p.slug] ?? 0
          return (
            <li key={p.slug}>
              <Link
                href={localizeHref(locale, `/province/${p.slug}`)}
                className="group flex h-full flex-col border border-rule bg-surface-raised px-4 py-4 transition-colors hover:border-brand hover:bg-brand-tint/30"
                lang={lang}
              >
                <h2 className="font-display text-h3 font-extrabold text-ink group-hover:text-brand-strong">
                  {en ? p.nameEn : p.nameNe}
                </h2>
                <span className="mt-2 block h-0.5 w-8 bg-brand" aria-hidden />
                <p className="mt-2 text-meta text-ink-soft">
                  {en
                    ? count === 1
                      ? '1 story'
                      : `${count} stories`
                    : count === 0
                      ? 'अझै सामग्री छैन'
                      : `${count} सामग्री`}
                </p>
                <span className="mt-3 text-caption font-bold text-brand-strong">
                  {en ? 'Open desk' : 'डेस्क खोल्नुहोस्'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {recent.length > 0 ? (
        <section className="mt-10">
          <div className="border-b border-rule pb-3">
            <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
              {en ? 'Recent provincial coverage' : 'हालैका प्रदेश सामग्री'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden />
          </div>
          <ul className="mt-2 divide-y divide-rule">
            {recent.slice(0, 9).map((story) => (
              <li key={story.slug} className="py-2.5">
                <InstrumentedStory
                  articleSlug={story.slug}
                  articleCategory={story.category.slug}
                >
                  <DenseStoryItem story={story} locale={locale} thumb="sm" showDeck={false} />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
