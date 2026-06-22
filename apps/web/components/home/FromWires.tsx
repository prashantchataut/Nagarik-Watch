import type { Locale } from '@nagarikwatch/db'
import { fetchAggregatedFeed, type NormalizedItem } from '@nagarikwatch/ingest'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { relativeTime } from '@/lib/live/format'

/**
 * FromWires — the homepage "स्रोतबाट / From wires" rail.
 *
 * Renders real, live headlines aggregated from official Nepali outlets' RSS feeds.
 * Each item is an EXTERNAL link (target=_blank, rel=noopener) to the original
 * publisher's article — Nagarik Watch never republishes body text, only surfaces
 * the headline with clear source attribution (PRODUCT.md trust policy + Google
 * News original-content rules).
 *
 * Server component: fetches once per render. If every feed is down the section
 * renders null rather than an empty box, so a total RSS outage never degrades
 * the homepage. The number of items is capped; freshness is shown per-item.
 */
export async function FromWires({ locale, className }: { locale: Locale; className?: string }) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const heading = locale === 'en' ? 'From wires' : 'स्रोतबाट'
  const subhead = locale === 'en'
    ? 'Headlines from official Nepali outlets. Taps open the original story.'
    : 'आधिकारिक नेपाली मिडियाका शीर्षकहरू। थिच्दा मूल समाचार खुल्छ।'

  let items: NormalizedItem[] = []
  try {
    items = await fetchAggregatedFeed(undefined, 8)
  } catch {
    items = []
  }

  if (items.length === 0) return null

  return (
    <section className={className} aria-label={heading}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-h2 font-bold text-ink" lang={lang}>
            {heading}
          </h2>
          <p className="mt-1 text-meta text-ink-soft" lang={lang}>
            {subhead}
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-brand-tint px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-brand-strong sm:inline-block">
          {locale === 'en' ? 'Aggregated' : 'संकलित'}
        </span>
      </div>

      <ul className="mt-5 divide-y divide-rule rounded-md border border-rule bg-surface">
        {items.map((item) => (
          <li key={item.sourceUrl}>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 px-4 py-3 transition-colors duration-fast ease-out-quint hover:bg-brand-tint/50"
            >
              <span className="font-semibold text-ink group-hover:text-brand-strong" lang={lang}>
                {item.titleNe}
              </span>
              <span className="flex items-center gap-2 text-caption text-ink-soft">
                <span className="font-semibold uppercase tracking-wide" lang={lang}>
                  {item.sourceName}
                </span>
                <span aria-hidden="true">·</span>
                <span>{relativeTime(item.sourcePublishedAt, locale)}</span>
                <ExternalGlyph />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-caption text-mute" lang={lang}>
        {dict.aggregatedFrom} · {locale === 'en' ? 'Links point to the original publishers.' : 'लिङ्क मूल प्रकाशकतर्फ जान्छन्।'}
      </p>
    </section>
  )
}

function ExternalGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="ml-auto opacity-60"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}
