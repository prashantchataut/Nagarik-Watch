import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getStories } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

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
  { ne: 'निर्णय र सच्याइ देखाउने', en: 'Publish verdict and correction path' },
]

export default async function FactCheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items } = await getStories({ locale, perPage: 12 })
  const candidates = items.filter((story) =>
    /fact|दाबी|तथ्य|गलत|सही|भ्रम/i.test(
      `${story.titleNe} ${story.titleEn ?? ''} ${story.deckNe ?? ''}`,
    ),
  )
  const stories = candidates

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <header className="grid gap-6 border-b border-rule pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)] lg:items-end">
        <div>
          <h1 className="font-display text-[clamp(2.05rem,9vw,4rem)] font-extrabold leading-tight text-ink">
            {en ? 'Claims need evidence, not volume' : 'दाबीलाई आवाज होइन, प्रमाण चाहिन्छ'}
          </h1>
          <p className="mt-3 max-w-3xl text-body-lg leading-relaxed text-ink-soft">
            {en
              ? 'A structured desk for viral claims, public statements, altered images and figures that need verification before readers share them.'
              : 'भाइरल दाबी, सार्वजनिक भनाइ, सम्पादित तस्बिर र तथ्याङ्कलाई पाठकले बाँड्नुअघि प्रमाणसहित जाँच्ने संरचित डेस्क।'}
          </p>
        </div>
        <a
          href={localizeHref(locale, '/fact-check-policy')}
          className="rounded-lg border border-rule bg-surface-raised p-4 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint"
        >
          <span className="text-meta font-bold text-ink">
            {en ? 'Method first' : 'पहिले पद्धति'}
          </span>
          <span className="mt-1 block text-meta leading-relaxed text-ink-soft">
            {en
              ? 'Read how verdicts, corrections and source notes work.'
              : 'निर्णय, सच्याइ र स्रोत नोट कसरी काम गर्छ पढ्नुहोस्।'}
          </span>
        </a>
      </header>

      <section className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-rule bg-surface-raised p-5">
          <h2 className="font-display text-h2 font-extrabold text-ink">
            {en ? 'Verdict labels' : 'निर्णय लेबल'}
          </h2>
          <div className="mt-4 grid gap-3">
            {verdicts.map((verdict) => (
              <div
                key={verdict.key}
                className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-rule pt-3 first:border-t-0 first:pt-0"
              >
                <p className="font-bold text-brand-strong">{en ? verdict.en : verdict.ne}</p>
                <p className="text-body text-ink-soft">{en ? verdict.bodyEn : verdict.bodyNe}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-rule bg-surface-raised p-5">
          <h2 className="font-display text-h2 font-extrabold text-ink">
            {en ? 'How one check moves' : 'एउटा जाँच कसरी अघि बढ्छ'}
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {workflow.map((item, index) => (
              <li
                key={item.en}
                className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-rule pt-3 first:border-t-0 first:pt-0 sm:border-t sm:pt-3"
              >
                <span className="font-display text-caption font-bold text-brand-strong">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-semibold text-ink">{en ? item.en : item.ne}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
          <div>
            <h2 className="font-display text-h1 font-extrabold text-ink">
              {en ? 'Recent verification work' : 'हालका तथ्य-जाँच सामग्री'}
            </h2>
          </div>
          <a
            href={localizeHref(locale, '/submit-story')}
            className="text-meta font-semibold text-ink-soft underline-offset-4 hover:text-brand-strong hover:underline"
          >
            {en ? 'Submit a claim' : 'दाबी पठाउनुहोस्'}
          </a>
        </div>

        {stories.length > 0 ? (
          <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="border border-rule bg-surface-raised p-5">
              <StoryCard story={stories[0]!} locale={locale} variant="featured" />
            </div>
            <div className="grid gap-5">
              {stories.slice(1).map((story) => (
                <StoryCard key={story.id} story={story} locale={locale} variant="horizontal" />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 border border-rule bg-surface-raised p-6">
            <p className="font-display text-h2 font-bold text-ink">
              {en ? 'No fact-check has been published yet.' : 'अहिले तथ्य-जाँच प्रकाशित भएको छैन।'}
            </p>
            <p className="mt-2 text-body text-ink-soft">
              {en
                ? 'The page stays useful by showing method and submission path until the first check is edited and published.'
                : 'पहिलो तथ्य-जाँच सम्पादन भएर प्रकाशित नहुँदासम्म यो पृष्ठले पद्धति र दाबी पठाउने बाटो देखाउँछ।'}
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
        ? 'Nagarik Watch fact-check desk for claims, evidence, verdicts and corrections.'
        : 'दाबी, प्रमाण, निर्णय र सच्याइका लागि नागरिक वाच तथ्य-जाँच डेस्क।',
    alternates: { canonical: localizeHref(locale, '/fact-check') },
  }
}

