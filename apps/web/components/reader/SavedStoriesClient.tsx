'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  recentUnfinished,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { recommendForReader } from '@/lib/reader/personalize'
import { CONSENT_EVENT, hasPersonalizationConsent, writeConsent } from '@/lib/reader/consent'

export function SavedStoriesClient({
  locale,
  catalog,
}: {
  locale: Locale
  catalog: StoryCardData[]
}) {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const [personalized, setPersonalized] = useState(false)
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    function refresh() {
      setPersonalized(hasPersonalizationConsent())
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

  const effectiveHistory = useMemo(() => (personalized ? history : []), [history, personalized])
  const continueItem = useMemo(
    () => (personalized ? recentUnfinished(history) : null),
    [history, personalized],
  )
  const recommendations = useMemo(
    () => recommendForReader(catalog, bookmarks, effectiveHistory, 6),
    [bookmarks, catalog, effectiveHistory],
  )
  const recent = personalized
    ? [...history].sort((a, b) => b.readAt.localeCompare(a.readAt)).slice(0, 6)
    : []

  function enablePersonalization() {
    writeConsent({
      essential: true,
      personalization: true,
      analytics: false,
      decidedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong">
          {locale === 'en' ? 'Reader Library' : 'पाठक लाइब्रेरी'}
        </p>
        <h1 className="mt-1 font-display text-display text-ink">
          {locale === 'en' ? 'Saved and recently read' : 'सुरक्षित र हालै पढिएको'}
        </h1>
        <p className="mt-3 max-w-body text-body-lg text-ink-soft">
          {locale === 'en'
            ? 'Bookmarks and reading history are kept in this browser with clear consent controls. Signing in identifies you, but this privacy-first library still works locally.'
            : 'बुकमार्क र पढाइ इतिहास स्पष्ट सहमतिसहित यही ब्राउजरमा राखिन्छ। साइन इनले तपाईंलाई चिनाउँछ, तर यो गोपनीयता-पहिलो लाइब्रेरी स्थानीय रूपमा काम गर्छ।'}
        </p>
      </header>

      {!personalized ? (
        <section className="mt-8 rounded-lg border border-rule bg-surface-raised p-5">
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Personal reading is off' : 'व्यक्तिगत पढाइ बन्द छ'}
          </h2>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {locale === 'en'
              ? 'Turn it on to save reading history, continue unfinished stories and tune recommendations on this browser.'
              : 'पढाइ इतिहास, अधुरो लेख जारी राख्ने सुविधा र यही ब्राउजरमा मिल्ने सिफारिसका लागि खोल्नुहोस्।'}
          </p>
          <button
            type="button"
            onClick={enablePersonalization}
            className="mt-4 inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong"
          >
            {locale === 'en' ? 'Enable personal desk' : 'व्यक्तिगत डेस्क खोल्नुहोस्'}
          </button>
        </section>
      ) : null}

      {continueItem ? (
        <section className="mt-8 rounded-lg border border-brand/30 bg-brand-tint p-5">
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Continue reading' : 'पढाइ जारी राख्नुहोस्'}
          </h2>
          <a
            href={continueItem.href}
            className="mt-2 block text-h3 font-semibold text-brand-strong"
          >
            {continueItem.title}
          </a>
          <p className="mt-1 text-caption text-ink-soft">
            {locale === 'en'
              ? `${continueItem.scrollDepth}% read · ${continueItem.sessions} session(s)`
              : `${continueItem.scrollDepth}% पढियो · ${continueItem.sessions} सत्र`}
          </p>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-h2 text-ink">
          {locale === 'en' ? 'Saved articles' : 'सुरक्षित लेख'}
        </h2>
        {bookmarks.length > 0 ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.articleId}>
                <StoryListLink
                  story={bookmark.story}
                  locale={locale}
                  meta={new Date(bookmark.savedAt).toLocaleString()}
                />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={locale === 'en' ? 'No saved articles yet' : 'अहिलेसम्म सुरक्षित लेख छैन'}
            body={
              locale === 'en'
                ? 'Use the Save button on any article.'
                : 'कुनै पनि लेखमा सुरक्षित गर्नुहोस् बटन प्रयोग गर्नुहोस्।'
            }
          />
        )}
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Recently read' : 'हालै पढिएको'}
          </h2>
          {recent.length > 0 ? (
            <ul className="mt-4 divide-y divide-rule rounded-lg border border-rule bg-surface-raised">
              {recent.map((item) => (
                <li key={`${item.articleId}-${item.readAt}`} className="p-4">
                  <a href={item.href} className="font-semibold text-ink hover:text-brand-strong">
                    {item.title}
                  </a>
                  <p className="mt-1 text-caption text-mute">
                    {locale === 'en'
                      ? `${item.scrollDepth}% read · ${item.completed ? 'completed' : 'in progress'}`
                      : `${item.scrollDepth}% पढियो · ${item.completed ? 'पूरा' : 'जारी'}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title={locale === 'en' ? 'No reading history yet' : 'पढाइ इतिहास छैन'}
              body={
                locale === 'en'
                  ? 'Open an article and scroll to start a session.'
                  : 'लेख खोलेर स्क्रोल गरेपछि सत्र सुरु हुन्छ।'
              }
            />
          )}
        </div>

        <div>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Recommended for you' : 'तपाईंका लागि सिफारिस'}
          </h2>
          <ul className="mt-4 grid gap-4">
            {recommendations.map((story) => (
              <li key={story.id}>
                <StoryListLink story={story} locale={locale} meta={story.categoryLabel} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function StoryListLink({
  story,
  locale,
  meta,
}: {
  story: StoryCardData
  locale: Locale
  meta: string
}) {
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const href = `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
  return (
    <a
      href={href}
      className="block rounded-lg border border-rule bg-surface-raised p-4 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40"
    >
      <p className="text-caption font-semibold uppercase tracking-wide text-brand-strong">{meta}</p>
      <h3 className="mt-1 font-display text-h3 text-ink">{title}</h3>
      {story.deckNe ? (
        <p className="mt-1 line-clamp-2 text-body text-ink-soft">{story.deckNe}</p>
      ) : null}
    </a>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-rule bg-surface-raised p-6">
      <h3 className="font-display text-h3 text-ink">{title}</h3>
      <p className="mt-2 text-body text-ink-soft">{body}</p>
    </div>
  )
}
