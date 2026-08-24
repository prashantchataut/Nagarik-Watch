import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, type Locale, type StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

const verdicts = [
  {
    key: 'verified',
    ne: 'सही',
    en: 'Verified',
    bodyNe: 'दाबी प्रमाणसँग मिल्छ।',
    bodyEn: 'The claim matches the evidence.',
  },
  {
    key: 'mixed',
    ne: 'मिश्रित',
    en: 'Mixed',
    bodyNe: 'केही अंश सही, केही अंश अपूर्ण वा भ्रामक।',
    bodyEn: 'Parts are true, parts are incomplete or misleading.',
  },
  {
    key: 'false',
    ne: 'गलत',
    en: 'False',
    bodyNe: 'मुख्य दाबी प्रमाणबाट समर्थन हुँदैन।',
    bodyEn: 'The core claim is not supported by evidence.',
  },
  {
    key: 'context_needed',
    ne: 'सन्दर्भ चाहिन्छ',
    en: 'Needs context',
    bodyNe: 'दाबी बुझ्न थप समय, स्थान वा स्रोत चाहिन्छ।',
    bodyEn: 'The claim needs time, place or source context.',
  },
] as const

const workflow = [
  { ne: 'दाबी छुट्याउने', en: 'Separate the claim' },
  { ne: 'मूल स्रोत खोज्ने', en: 'Find the primary source' },
  { ne: 'स्वतन्त्र प्रमाण मिलाउने', en: 'Match independent evidence' },
  { ne: 'निर्णय र सच्याइ देखाउने', en: 'Publish the verdict and correction path' },
]

function titleFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function verdictFor(story: StoryCardData, locale: Locale) {
  const item = verdicts.find((entry) => entry.key === story.factCheckStatus)
  if (!item) return locale === 'en' ? 'Under review' : 'जाँचमा'
  return locale === 'en' ? item.en : item.ne
}

function hrefFor(story: StoryCardData, locale: Locale) {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

export default async function FactCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: stories } = await getStories({ locale, factCheck: true, perPage: 16 }).catch(
    () => ({ items: [] }),
  )
  const [lead, ...ledger] = stories

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12" lang={lang}>
      <HubIndexHeader
        title={en ? 'Fact check' : 'तथ्य-जाँच'}
        lead={
          en
            ? 'Claims are separated from evidence, checked against primary sources and published with a visible verdict.'
            : 'दाबीलाई प्रमाणबाट छुट्याएर मूल स्रोतसँग जाँचिन्छ र स्पष्ट निर्णयसहित प्रकाशित गरिन्छ।'
        }
        lang={lang}
      />

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-meta">
        <Link
          href={localizeHref(locale, '/fact-check-policy')}
          className="font-semibold text-brand-strong underline-offset-4 hover:underline"
        >
          {en ? 'Read the fact-check policy →' : 'तथ्य-जाँच नीति पढ्नुहोस् →'}
        </Link>
        <Link
          href={localizeHref(locale, '/submit-story')}
          className="font-semibold text-ink-soft underline-offset-4 hover:text-brand-strong hover:underline"
        >
          {en ? 'Send a claim for review →' : 'जाँचका लागि दाबी पठाउनुहोस् →'}
        </Link>
      </div>

      <section
        className="mt-8 grid border-y border-rule lg:grid-cols-[minmax(0,1fr)_22rem]"
        aria-label={en ? 'Fact-check method' : 'तथ्य-जाँच पद्धति'}
      >
        <div className="py-6 lg:border-r lg:pr-7">
          <p className="text-caption font-bold text-brand-strong">
            {en ? 'Verdict language' : 'निर्णय भाषा'}
          </p>
          <h2 className="mt-1 font-display text-h2 font-extrabold text-ink">
            {en ? 'What each label means' : 'हरेक लेबलको अर्थ'}
          </h2>
          <ul className="mt-4 divide-y divide-rule border-t border-rule">
            {verdicts.map((verdict) => (
              <li
                key={verdict.key}
                className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
              >
                <p className="font-bold text-brand-strong">{en ? verdict.en : verdict.ne}</p>
                <p className="text-body text-ink-soft">{en ? verdict.bodyEn : verdict.bodyNe}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-rule py-6 lg:border-t-0 lg:pl-7">
          <p className="text-caption font-bold text-brand-strong">{en ? 'Method' : 'पद्धति'}</p>
          <h2 className="mt-1 font-display text-h3 font-extrabold text-ink">
            {en ? 'Four visible steps' : 'चार देखिने चरण'}
          </h2>
          <ol className="mt-3 divide-y divide-rule border-y border-rule">
            {workflow.map((item, index) => (
              <li key={item.en} className="grid grid-cols-[2rem_1fr] gap-2.5 py-3">
                <span
                  className="text-caption font-black tabular-nums text-brand-strong"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-ink">{en ? item.en : item.ne}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {lead ? (
        <section className="mt-8" aria-labelledby="fact-check-ledger-heading">
          <header className="border-b border-rule pb-2.5">
            <p className="text-caption font-bold text-brand-strong">
              {en ? 'Evidence ledger' : 'प्रमाण रजिस्टर'}
            </p>
            <h2
              id="fact-check-ledger-heading"
              className="font-display text-h1 font-extrabold text-ink"
            >
              {en ? 'Recent checks' : 'हालका तथ्य-जाँच'}
            </h2>
          </header>

          <article className="grid gap-5 border-b border-rule py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-center">
            {lead.heroImage?.url && !lead.heroImage.url.startsWith('data:') ? (
              <Link
                href={hrefFor(lead, locale)}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block aspect-[16/9] overflow-hidden bg-surface-raised"
              >
                <Image
                  src={lead.heroImage.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                />
              </Link>
            ) : null}
            <div className="min-w-0">
              <p className="text-caption font-black text-brand-strong">
                {verdictFor(lead, locale)}
              </p>
              <h3 className="mt-2 text-pretty font-display text-[clamp(2rem,4.2vw,3.6rem)] font-extrabold leading-[1.12] text-ink">
                <Link
                  href={hrefFor(lead, locale)}
                  className="hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
                >
                  {titleFor(lead, locale)}
                </Link>
              </h3>
              {deckFor(lead, locale) ? (
                <p className="mt-3 max-w-body text-body-lg leading-relaxed text-ink-soft">
                  {deckFor(lead, locale)}
                </p>
              ) : null}
              <p className="mt-3 text-caption text-mute">
                {formatDate(lead.publishedAt, locale)} · {lead.byline}
              </p>
            </div>
          </article>

          {ledger.length > 0 ? (
            <ol className="divide-y divide-rule">
              {ledger.map((story, index) => (
                <li key={story.id}>
                  <Link
                    href={hrefFor(story, locale)}
                    className="group grid gap-2 py-4 sm:grid-cols-[2.25rem_8.5rem_minmax(0,1fr)] sm:items-start"
                  >
                    <span
                      className="hidden pt-0.5 text-caption font-black tabular-nums text-mute sm:block"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-caption font-black text-brand-strong">
                      {verdictFor(story, locale)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-[1.25rem] font-extrabold leading-tight text-ink transition-colors group-hover:text-brand-strong">
                        {titleFor(story, locale)}
                      </h3>
                      {deckFor(story, locale) ? (
                        <p className="mt-1 line-clamp-2 text-body text-ink-soft">
                          {deckFor(story, locale)}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-caption text-mute">
                        {formatDate(story.publishedAt, locale)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : (
        <div className="editorial-empty mt-8">
          <p className="font-display text-h2 font-bold text-ink">
            {en ? 'No fact-check published yet.' : 'अहिले तथ्य-जाँच प्रकाशित भएको छैन।'}
          </p>
          <p className="mt-2 max-w-2xl text-body text-ink-soft">
            {en
              ? 'Use the method above and send a claim for review.'
              : 'माथिको पद्धति हेर्नुहोस् वा दाबी समीक्षाका लागि पठाउनुहोस्।'}
          </p>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Fact Check' : 'तथ्य-जाँच',
    description:
      locale === 'en'
        ? 'Fact-checked claims, evidence, verdicts and corrections from Nagarik Watch.'
        : 'नागरिक वाचबाट दाबी, प्रमाण, निर्णय र सच्याइका तथ्य-जाँच।',
    alternates: { canonical: localizeHref(locale, '/fact-check') },
  }
}
