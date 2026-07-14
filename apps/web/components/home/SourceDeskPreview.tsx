import Link from 'next/link'
import type { NormalizedItem } from '@nagarikwatch/ingest'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function SourceDeskPreview({
  items,
  locale,
}: {
  items: NormalizedItem[]
  locale: Locale
}) {
  if (!items.length) return null
  const english = locale === 'en'

  return (
    <section className="border-y border-rule py-8" aria-labelledby="source-desk-preview-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
        <div>
          <p className="text-caption font-black uppercase tracking-[0.16em] text-brand-strong">
            {english ? 'External publishers' : 'बाह्य प्रकाशक'}
          </p>
          <h2 id="source-desk-preview-title" className="mt-1 font-display text-h1 text-ink">
            {english ? 'Source desk' : 'स्रोत डेस्क'}
          </h2>
        </div>
        <Link
          href={localizeHref(locale, '/wire')}
          className="border-b-2 border-brand text-meta font-black text-ink hover:text-brand-strong"
        >
          {english ? 'See all sources' : 'सबै स्रोत हेर्नुहोस्'}
        </Link>
      </div>
      <p className="mt-4 max-w-body text-meta leading-relaxed text-ink-soft">
        {english
          ? 'Headlines and original links only. Nagarik Watch does not republish these articles.'
          : 'यहाँ शीर्षक र मूल लिङ्क मात्र छन्। नागरिक वाचले यी समाचार पुनःप्रकाशन गर्दैन।'}
      </p>
      <ol className="mt-5 grid gap-x-8 border-t border-rule md:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.sourceUrl} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-rule py-4">
            <span className="font-display text-h3 font-black text-rule" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-display text-body-lg font-black leading-snug text-ink hover:text-brand-strong"
              >
                {item.titleNe}
              </a>
              <p className="mt-1 text-caption text-mute">
                <strong className="text-ink-soft">{item.sourceName}</strong>
                {item.sourcePublishedAt ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <time dateTime={item.sourcePublishedAt}>
                      {formatDate(item.sourcePublishedAt, locale)}
                    </time>
                  </>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
