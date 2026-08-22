import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { PROVINCES } from '@/lib/site'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { CategoryDesk } from '@/components/category/CategoryDesk'

type ProvinceMeta = (typeof PROVINCES)[number]

type ProvinceDeskProps = {
  locale: Locale
  province: ProvinceMeta
  stories: StoryCardData[]
}

type ProvinceIndexDesk = {
  province: ProvinceMeta
  total: number
  latest?: StoryCardData
}

export function ProvinceDesk({ locale, province, stories }: ProvinceDeskProps) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const title = en ? province.nameEn : province.nameNe
  const lead = en
    ? `Reporting, accountability and public-service updates filed to the ${province.nameEn} desk.`
    : `${province.nameNe} डेस्कमा दर्ता भएका स्थानीय रिपोर्टिङ, जवाफदेहिता र सार्वजनिक सेवा अपडेट।`

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-6">
      <HubIndexHeader title={title} lead={lead} lang={lang} />
      <ProvinceSwitcher locale={locale} activeSlug={province.slug} />

      {stories.length > 0 ? (
        <div className="mt-6">
          <CategoryDesk
            stories={stories}
            locale={locale}
            sideKicker={{ ne: 'प्रदेश फाइल', en: 'Province file' }}
            moreHeading={{ ne: 'यस प्रदेशबाट थप', en: 'More from this province' }}
          />
        </div>
      ) : (
        <ProvinceEmpty locale={locale} province={province} />
      )}
    </div>
  )
}

function ProvinceSwitcher({ locale, activeSlug }: { locale: Locale; activeSlug?: string }) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <nav
      className="mt-4 overflow-x-auto border-y border-rule [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={en ? 'Province desks' : 'प्रदेश डेस्क'}
    >
      <ul className="flex min-w-max items-center">
        <li>
          <Link
            href={localizeHref(locale, '/province')}
            className={`inline-flex min-h-11 items-center border-b-2 px-3 text-meta font-bold transition-colors ${
              !activeSlug
                ? 'border-brand text-brand-strong'
                : 'border-transparent text-ink-soft hover:border-rule-strong hover:text-ink'
            }`}
            aria-current={!activeSlug ? 'page' : undefined}
            lang={lang}
          >
            {en ? 'Overview' : 'समग्र'}
          </Link>
        </li>
        {PROVINCES.map((p) => {
          const active = p.slug === activeSlug
          return (
            <li key={p.slug}>
              <Link
                href={localizeHref(locale, `/province/${p.slug}`)}
                className={`inline-flex min-h-11 items-center border-b-2 px-3 text-meta font-bold transition-colors ${
                  active
                    ? 'border-brand text-brand-strong'
                    : 'border-transparent text-ink-soft hover:border-rule-strong hover:text-ink'
                }`}
                aria-current={active ? 'page' : undefined}
                lang={lang}
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

function ProvinceEmpty({ locale, province }: { locale: Locale; province: ProvinceMeta }) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const name = en ? province.nameEn : province.nameNe

  return (
    <section className="mt-8 border-y border-rule py-7 sm:py-9" lang={lang}>
      <p className="font-display text-h2 font-extrabold text-ink">
        {en
          ? `No published stories in the ${name} desk yet`
          : `${name} डेस्कमा प्रकाशित सामग्री छैन`}
      </p>
      <p className="mt-2 max-w-body text-body leading-relaxed text-ink-soft">
        {en
          ? 'This page only shows reporting explicitly filed to this province. National stories are not substituted to make the desk look populated.'
          : 'यो पृष्ठमा यही प्रदेशमा स्पष्ट रूपमा दर्ता भएका रिपोर्टिङ मात्र देखिन्छन्। डेस्क भरिएको देखाउन राष्ट्रिय समाचार मिसाइँदैन।'}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-meta font-bold">
        <Link
          href={localizeHref(locale, '/province')}
          className="text-brand-strong hover:underline"
        >
          {en ? 'Browse all provinces' : 'सबै प्रदेश हेर्नुहोस्'}
        </Link>
        <Link
          href={localizeHref(locale, '/latest')}
          className="text-ink hover:text-brand-strong hover:underline"
        >
          {en ? 'Open national latest' : 'राष्ट्रिय ताजा खोल्नुहोस्'}
        </Link>
      </div>
    </section>
  )
}

export function ProvinceIndex({
  locale,
  desks,
  recent,
}: {
  locale: Locale
  desks: ProvinceIndexDesk[]
  recent: StoryCardData[]
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <HubIndexHeader
        title={en ? 'Province desks' : 'प्रदेश डेस्क'}
        lead={
          en
            ? 'Seven accountable local desks. Counts come from the complete published index, not the number of cards loaded on this page.'
            : 'सात स्थानीय डेस्क। यहाँको संख्या यो पृष्ठमा लोड भएका कार्ड होइन, सम्पूर्ण प्रकाशित सूचकाङ्कबाट आउँछ।'
        }
        lang={lang}
      />

      <ProvinceSwitcher locale={locale} />

      <section className="mt-6" aria-label={en ? 'All province desks' : 'सबै प्रदेश डेस्क'}>
        <ol className="border-y border-rule lg:grid lg:grid-cols-2 lg:[&>li:nth-child(odd)]:border-r lg:[&>li:nth-child(odd)]:pr-6 lg:[&>li:nth-child(even)]:pl-6">
          {desks.map(({ province, total, latest }, index) => {
            const name = en ? province.nameEn : province.nameNe
            return (
              <li
                key={province.slug}
                className="border-b border-rule py-5 last:border-b-0 lg:last:border-b lg:[&:nth-last-child(-n+2)]:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-caption font-black tabular-nums text-mute"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h2 className="font-display text-h2 font-extrabold text-ink" lang={lang}>
                      <Link
                        href={localizeHref(locale, `/province/${province.slug}`)}
                        className="hover:text-brand-strong"
                      >
                        {name}
                      </Link>
                    </h2>
                  </div>
                  <span className="text-caption font-bold tabular-nums text-mute" lang={lang}>
                    {en ? `${total} published` : `${total} प्रकाशित`}
                  </span>
                </div>

                {latest ? (
                  <div className="mt-3 pl-9">
                    <p className="text-caption font-bold text-brand-strong" lang={lang}>
                      {en ? 'Latest filing' : 'पछिल्लो फाइलिङ'}
                    </p>
                    <InstrumentedStory
                      articleSlug={latest.slug}
                      articleCategory={latest.category.slug}
                    >
                      <DenseStoryItem
                        story={latest}
                        locale={locale}
                        thumb="sm"
                        showDeck={false}
                        showMeta
                      />
                    </InstrumentedStory>
                  </div>
                ) : (
                  <p className="mt-3 pl-9 text-meta text-ink-soft" lang={lang}>
                    {en ? 'No published filing yet.' : 'अहिलेसम्म प्रकाशित फाइलिङ छैन।'}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {recent.length > 0 ? (
        <section className="mt-10">
          <header className="border-b border-rule pb-2.5">
            <p className="text-caption font-bold text-brand-strong" lang={lang}>
              {en ? 'Across Nepal' : 'नेपालभरिबाट'}
            </p>
            <h2 className="mt-0.5 font-display text-h2 font-extrabold text-ink" lang={lang}>
              {en ? 'Recent provincial reporting' : 'हालैका प्रदेश रिपोर्टिङ'}
            </h2>
          </header>
          <ul className="divide-y divide-rule">
            {recent.slice(0, 8).map((story) => (
              <li key={story.id} className="py-3.5">
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem story={story} locale={locale} thumb="md" showDeck showMeta />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
