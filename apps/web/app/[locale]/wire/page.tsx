import type { Metadata } from 'next'
import Link from 'next/link'
import { fetchAggregatedFeed, INGEST_SOURCES } from '@nagarikwatch/ingest'
import { formatDate } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'स्रोत डेस्क | Source Desk',
  description: 'नेपालका सार्वजनिक RSS स्रोतबाट शीर्षक र मूल लिङ्क मात्र।',
}

export default async function WireDigestPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const items = await fetchAggregatedFeed(INGEST_SOURCES, 30).catch(() => [])

  return (
    <main className="mx-auto max-w-page px-4 py-10 sm:py-14" lang={english ? 'en' : 'ne'}>
      <header className="grid gap-6 border-b-[3px] border-ink pb-8 lg:grid-cols-[1fr_22rem] lg:items-end">
        <div>
          <p className="text-caption font-black uppercase tracking-[0.16em] text-brand-strong">
            {english ? 'External source monitor' : 'बाह्य स्रोत अनुगमन'}
          </p>
          <h1 className="mt-2 max-w-[14ch] font-display text-[clamp(2.5rem,6vw,4.75rem)] font-black leading-[1.02] tracking-[-0.03em] text-ink">
            {english ? 'Source desk' : 'स्रोत डेस्क'}
          </h1>
        </div>
        <p className="text-body leading-relaxed text-ink-soft">
          {english
            ? 'This page shows headlines and links from registered public feeds. Nagarik Watch does not copy the articles, images, or reporting. Open the publisher link to read the original.'
            : 'यो पृष्ठमा दर्ता गरिएका सार्वजनिक फिडका शीर्षक र मूल लिङ्क मात्र देखाइन्छ। नागरिक वाचले ती समाचारको पाठ, तस्बिर वा रिपोर्टिङ प्रतिलिपि गर्दैन। पूरा समाचार पढ्न सम्बन्धित प्रकाशकको लिङ्क खोल्नुहोस्।'}
        </p>
      </header>

      {items.length ? (
        <ol className="divide-y divide-rule">
          {items.map((item, index) => (
            <li key={item.sourceUrl} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-start sm:gap-5">
              <span className="font-display text-h1 font-black leading-none text-rule" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-display text-h2 font-black leading-snug text-ink hover:text-brand-strong"
                >
                  {item.titleNe}
                </a>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-soft">
                  <strong className="text-brand-strong">{item.sourceName}</strong>
                  <span aria-hidden="true">·</span>
                  {item.sourcePublishedAt ? (
                    <time dateTime={item.sourcePublishedAt}>
                      {formatDate(item.sourcePublishedAt, locale)}
                    </time>
                  ) : (
                    <span>{english ? 'Source time unavailable' : 'स्रोत समय खुलेको छैन'}</span>
                  )}
                  {item.category ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex min-h-10 items-center justify-self-start border-b-2 border-brand text-meta font-black text-ink hover:text-brand-strong sm:justify-self-end"
              >
                {english ? 'Open source ↗' : 'मूल स्रोत खोल्नुहोस् ↗'}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <section className="border-b border-rule py-14">
          <h2 className="font-display text-h1 text-ink">
            {english ? 'Source feeds are temporarily unavailable.' : 'स्रोत फिड अहिले उपलब्ध छैनन्।'}
          </h2>
          <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft">
            {english
              ? 'The page is showing an honest empty state instead of cached or invented headlines. Try the latest original Nagarik Watch stories.'
              : 'पुराना वा काल्पनिक शीर्षक देखाउनुको सट्टा यहाँ स्पष्ट खाली अवस्था राखिएको छ। नागरिक वाचका पछिल्ला मौलिक समाचार हेर्नुहोस्।'}
          </p>
          <Link
            href={localizeHref(locale, '/latest')}
            className="mt-5 inline-flex border-b-2 border-brand font-bold text-ink hover:text-brand-strong"
          >
            {english ? 'Go to latest stories' : 'ताजा समाचारमा जानुहोस्'}
          </Link>
        </section>
      )}
    </main>
  )
}
