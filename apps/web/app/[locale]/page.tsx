import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { Hero, StoryCard } from '@nagarikwatch/ui'
import { getHomepage } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale } from '@/lib/i18n/locales'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { TodayInBrief } from '@/components/home/TodayInBrief'
import { PollOfDay } from '@/components/home/PollOfDay'
import { FromWires } from '@/components/home/FromWires'
import { ProvinceHub } from '@/components/home/ProvinceHub'
import { HomeLiveBoard } from '@/components/live/HomeLiveBoard'
import { AdSlot } from '@/components/AdSlot'
import { LogoMark } from '@/components/Logo'

export const revalidate = 300

type Params = { locale: string }

export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const data = await getHomepage()
  const dict = getDictionary(locale)

  if (!data) return <EmptyHome locale={locale} dict={dict} />

  return (
    <div>
      {data.breaking.length > 0 && <BreakingTicker stories={data.breaking} locale={locale} />}
      <div className="mx-auto max-w-page px-4 pt-4">
        <AdSlot variant="leaderboard" locale={locale} placementKey="home-top" />
      </div>
      <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
          <div><Hero story={data.lead} locale={locale} /></div>
          <aside aria-label={dict.more} className="flex flex-col gap-6 border-t border-rule pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <TodayInBrief stories={data.secondary} locale={locale} />
            {data.secondary.length > 0 && (
              <ul className="flex flex-col divide-y divide-rule">
                {data.secondary.slice(0, 4).map((s) => (
                  <li key={s.slug} className="py-3 first:pt-0"><StoryCard story={s} locale={locale} variant="horizontal" /></li>
                ))}
              </ul>
            )}
            <PollOfDay locale={locale} />
          </aside>
        </div>
        <HomeLiveBoard locale={locale} className="mt-12 border-t border-rule pt-8 sm:mt-14" />
        <FromWires locale={locale} className="mt-12 sm:mt-14" />
        <ProvinceHub locale={locale} className="mt-12 sm:mt-14" />
        <div className="mt-12 flex justify-center sm:mt-14"><AdSlot variant="leaderboard" locale={locale} placementKey="home-mid" /></div>
        <div className="mt-14 flex flex-col gap-12 sm:gap-16">
          {data.sections.map((section, i) => (
            <SectionBlock key={section.category.slug} section={section} locale={locale} className={i % 2 === 1 ? 'border-t border-rule pt-10 sm:pt-12' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyHome({ locale, dict }: { locale: Locale; dict: ReturnType<typeof getDictionary> }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:py-12">
      <section className="border-b border-rule pb-8 sm:pb-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-11 w-11 sm:h-12 sm:w-12" />
              <div>
                <h1 className="font-display text-h1 leading-tight text-ink sm:text-display" lang="ne">{en ? 'Welcome to Nagarik Watch' : 'नागरिक वाचमा स्वागत छ'}</h1>
                <p className="mt-1 text-meta font-semibold uppercase tracking-wide text-brand-strong" lang="ne">{dict.tagline}</p>
              </div>
            </div>
            <p className="mt-5 text-body leading-relaxed text-ink-soft sm:text-body-lg" lang={lang}>
              {en ? 'A civic-minded Nepali news portal. The reader site shows original Nagarik Watch content, daily utilities, and clear editorial trust pages.' : 'नागरिककेन्द्रित नेपाली समाचार पोर्टल। पाठक साइटमा नागरिक वाचका मौलिक सामग्री, दैनिक उपयोगी सेवा र स्पष्ट सम्पादकीय भरोसा पृष्ठ देखिन्छन्।'}
            </p>
          </div>
          <div className="rounded-lg border border-rule bg-surface-raised p-4 text-meta text-ink-soft" lang={lang}>
            {en
              ? 'The public desk is ready. Published stories will appear here after editorial review.'
              : 'सार्वजनिक डेस्क तयार छ। सम्पादकीय समीक्षा भएपछि प्रकाशित समाचार यहाँ देखिन्छन्।'}
          </div>
        </div>
      </section>
      <HomeLiveBoard locale={locale} className="mt-10 border-t border-rule pt-8" />
      <FromWires locale={locale} className="mt-12" />
      <ProvinceHub locale={locale} className="mt-12" />
    </div>
  )
}

export function generateMetadata(): Metadata {
  return { alternates: { canonical: '/', languages: { ne: '/', en: '/en' } } }
}
