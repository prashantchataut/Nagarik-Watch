'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { CONSENT_EVENT, hasPersonalizationConsent, writeConsent } from '@/lib/reader/consent'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { recommendForReader } from '@/lib/reader/personalize'

export function RecommendedForYou({
  locale,
  catalog,
  className,
}: {
  locale: Locale
  catalog: StoryCardData[]
  className?: string
}) {
  const [enabled, setEnabled] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    function refresh() {
      setEnabled(hasPersonalizationConsent())
      setBookmarks(safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)))
      setHistory(safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY)))
    }
    refresh()
    window.addEventListener(CONSENT_EVENT, refresh)
    window.addEventListener('nw-reader-state-change', refresh)
    return () => {
      window.removeEventListener(CONSENT_EVENT, refresh)
      window.removeEventListener('nw-reader-state-change', refresh)
    }
  }, [])

  const recommendations = useMemo(() => {
    if (!enabled) return catalog.slice(0, 5)
    return recommendForReader(catalog, bookmarks, history, 5)
  }, [bookmarks, catalog, enabled, history])

  function enable() {
    writeConsent({
      essential: true,
      personalization: true,
      analytics: false,
      decidedAt: new Date().toISOString(),
    })
  }

  if (recommendations.length === 0) return null

  return (
    <section
      className={className}
      aria-label={locale === 'en' ? 'Recommended for you' : 'तपाईंका लागि सिफारिस'}
    >
      <div className="grid gap-5 rounded-2xl border border-rule bg-surface-raised p-4 sm:p-5 lg:grid-cols-[17rem_1fr] lg:gap-7">
        <div className="lg:border-r lg:border-rule lg:pr-6">
          <p
            className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong"
            lang="en"
          >
            Reader picks
          </p>
          <h2
            className="mt-1 font-display text-h1 font-extrabold leading-tight text-ink"
            lang={lang}
          >
            {locale === 'en' ? 'Recommended for you' : 'तपाईंका लागि सिफारिस'}
          </h2>
          <p className="mt-2 text-meta leading-relaxed text-ink-soft" lang={lang}>
            {enabled
              ? locale === 'en'
                ? 'Based on saved stories, reading progress, category affinity and freshness. Stored on this browser.'
                : 'सुरक्षित लेख, पढाइ प्रगति, विभाग रुचि र ताजापनका आधारमा। डाटा यही ब्राउजरमा रहन्छ।'
              : locale === 'en'
                ? 'Turn on personalization to make this rail learn from your reading.'
                : 'पढाइ र सुरक्षित लेखका आधारमा सिफारिस मिलाउन अनुमति दिनुहोस्।'}
          </p>
          {!enabled ? (
            <button
              type="button"
              onClick={enable}
              className="mt-4 inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-meta font-semibold text-surface transition-colors hover:bg-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Enable on this device' : 'यो उपकरणमा खोल्नुहोस्'}
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)]">
          <StoryCard story={recommendations[0]!} locale={locale} variant="featured" />
          <ol className="divide-y divide-rule border-y border-rule">
            {recommendations.slice(1).map((story, index) => (
              <li
                key={story.id}
                className="grid grid-cols-[2rem_1fr] gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="pt-1 font-mono text-caption font-bold text-mute">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <StoryCard story={story} locale={locale} variant="text-led" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
