import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
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
    key: 'context',
    ne: 'सन्दर्भ चाहिन्छ',
    en: 'Needs context',
    bodyNe: 'दाबी बुझ्न थप समय, स्थान वा स्रोत चाहिन्छ।',
    bodyEn: 'The claim needs time, place or source context.',
  },
]

const workflow = [
  { ne: 'दाबी छुट्याउने', en: 'Separate the claim' },
  { ne: 'मूल स्रोत खोज्ने', en: 'Find the primary source' },
  { ne: 'स्वतन्त्र प्रमाण मिलाउने', en: 'Match independent evidence' },
  { ne: 'निर्णय र सच्याइ देखाउने', en: 'Publish the verdict and how to correct it' },
]

export default async function FactCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items } = await getStories({ locale, perPage: 12 })
  const stories = items.filter((story) =>
    /fact|दाबी|तथ्य|गलत|सही|भ्रम/i.test(
      `${story.titleNe} ${story.titleEn ?? ''} ${story.deckNe ?? ''}`,
    ),
  )

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12" lang={lang}>
      <HubIndexHeader
        title={en ? 'Fact check' : 'तथ्य-जाँच'}
        lead={
          en
            ? 'Viral claims, public statements, and altered figures checked against primary evidence before you share them.'
            : 'भाइरल दाबी, सार्वजनिक भनाइ र सम्पादित तथ्याङ्कलाई बाँड्नुअघि मूल प्रमाणसँग जाँच।'
        }
        lang={lang}
      />

      <p className="mt-4">
        <a
          href={localizeHref(locale, '/fact-check-policy')}
          className="text-meta font-semibold text-brand-strong underline-offset-4 hover:underline"
        >
          {en ? 'How verdicts and corrections work →' : 'निर्णय र सच्याइ कसरी काम गर्छ →'}
        </a>
      </p>

      <section className="mt-8 border-y border-rule py-6">
        <h2 className="font-display text-h2 font-extrabold text-ink">
          {en ? 'Verdict labels' : 'निर्णय लेबल'}
        </h2>
        <ul className="mt-4">
          {verdicts.map((verdict) => (
            <li
              key={verdict.key}
              className="grid gap-1 border-t border-rule py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
            >
              <p className="font-bold text-brand-strong">{en ? verdict.en : verdict.ne}</p>
              <p className="text-body text-ink-soft">{en ? verdict.bodyEn : verdict.bodyNe}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-2 border-b border-rule py-6">
        <h2 className="font-display text-h2 font-extrabold text-ink">
          {en ? 'How a check proceeds' : 'जाँच कसरी अघि बढ्छ'}
        </h2>
        <ol className="mt-4 grid gap-0 sm:grid-cols-2">
          {workflow.map((item, index) => (
            <li
              key={item.en}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-rule py-3 sm:odd:pr-6 sm:even:pl-6"
            >
              <span className="font-display text-caption font-bold text-brand-strong">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-semibold text-ink">{en ? item.en : item.ne}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
          <h2 className="font-display text-h1 font-extrabold text-ink">
            {en ? 'Recent checks' : 'हालका तथ्य-जाँच'}
          </h2>
          <a
            href={localizeHref(locale, '/submit-story')}
            className="text-meta font-semibold text-ink-soft underline-offset-4 hover:text-brand-strong hover:underline"
          >
            {en ? 'Submit a claim' : 'दाबी पठाउनुहोस्'}
          </a>
        </div>

        {stories.length > 0 ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
            <StoryCard story={stories[0]!} locale={locale} variant="featured" />
            <div className="grid gap-5 border-t border-rule pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
              {stories.slice(1).map((story) => (
                <StoryCard key={story.id} story={story} locale={locale} variant="horizontal" />
              ))}
            </div>
          </div>
        ) : (
          <div className="editorial-empty mt-6">
            <p className="font-display text-h2 font-bold text-ink">
              {en ? 'No fact-check published yet.' : 'अहिले तथ्य-जाँच प्रकाशित भएको छैन।'}
            </p>
            <p className="mt-2 max-w-2xl text-body text-ink-soft">
              {en
                ? 'Until the first check appears, use the method above and send a claim for review.'
                : 'पहिलो जाँच आउँदासम्म माथिको पद्धति हेर्नुहोस् वा दाबी समीक्षाका लागि पठाउनुहोस्।'}
            </p>
          </div>
        )}
      </section>
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
