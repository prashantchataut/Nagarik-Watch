'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RECOMMENDER_VERSION, type Locale, type RecStrategy, type StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { CONSENT_EVENT, getOrCreateReaderId, hasPersonalizationConsent, mergeConsent } from '@/lib/reader/consent'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { buildAffinity, continueReadingForReader, recommendForReader } from '@/lib/reader/personalize'
import { rankDigestStories } from '@/lib/reader/digest'
import { READER_PREFERENCES_EVENT, readLocalReaderPreferences, writeLocalReaderPreferences } from '@/lib/reader/preferences'
import type { ReaderPreferences } from '@/lib/reader/preferences-store'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { localizeHref } from '@/lib/i18n/locales'

type ServerBookmark = { articleSlug: string; articleCategory: string; articleTitleNe: string; createdAt: string }
type ServerHistory = {
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  articleTagSlugs?: string[]
  articleAuthorSlugs?: string[]
  readPercent: number
  dwellSeconds: number
  completed: boolean
  sessions: number
  firstReadAt: string
  readAt: string
}

function isRealPhoto(url: string | undefined): boolean {
  return Boolean(url && !url.startsWith('data:'))
}

function fetchServerOrder(locale: Locale): Promise<Array<{ id: string; recStrategy: RecStrategy }> | null> {
  if (!hasLivePublicApi()) return Promise.resolve(null)
  const fingerprint = getOrCreateReaderId()
  return fetch(
    `/api/recommendations/personalized?fingerprint=${encodeURIComponent(fingerprint)}&locale=${locale}&limit=8`,
    { cache: 'no-store' },
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => (Array.isArray(body?.recommendations) ? body.recommendations : null))
}

function syncFromServer(catalog: StoryCardData[], locale: Locale) {
  if (!hasLivePublicApi()) return Promise.resolve()
  const fingerprint = getOrCreateReaderId()
  const byRoute = new Map(catalog.map((story) => [`${story.category.slug}:${story.slug}`, story]))
  return Promise.all([
    fetch(`/api/bookmarks?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : null,
    ),
    fetch(`/api/reading?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : null,
    ),
    fetch(`/api/preferences?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) =>
      r.ok ? r.json() : null,
    ),
  ]).then(([bookmarkBody, historyBody, preferenceBody]) => {
    if (bookmarkBody?.bookmarks) {
      const next: BookmarkRecord[] = (bookmarkBody.bookmarks as ServerBookmark[]).flatMap((item) => {
        const story = byRoute.get(`${item.articleCategory}:${item.articleSlug}`)
        return story ? [{ articleId: story.id, story, savedAt: item.createdAt }] : []
      })
      localStorage.setItem(READER_BOOKMARKS_KEY, JSON.stringify(next))
    }
    if (historyBody?.history) {
      const next: ReadingHistoryRecord[] = (historyBody.history as ServerHistory[]).flatMap((item) => {
        const story = byRoute.get(`${item.articleCategory}:${item.articleSlug}`)
        return [
          {
            articleId: story?.id ?? `history:${item.articleCategory}:${item.articleSlug}`,
            slug: story?.slug ?? item.articleSlug,
            categorySlug: story?.category.slug ?? item.articleCategory,
            tagSlugs: item.articleTagSlugs ?? [],
            authorSlugs: item.articleAuthorSlugs ?? [],
            title: story
              ? locale === 'en' && story.titleEn
                ? story.titleEn
                : story.titleNe
              : item.articleTitleNe,
            href: `${locale === 'en' ? '/en' : ''}/${item.articleCategory}/${item.articleSlug}`,
            readAt: item.readAt,
            firstReadAt: item.firstReadAt,
            scrollDepth: item.readPercent,
            completed: item.completed,
            sessions: item.sessions,
            dwellSeconds: item.dwellSeconds,
          },
        ]
      })
      localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(next))
    }
    if (preferenceBody?.preferences) writeLocalReaderPreferences(preferenceBody.preferences as ReaderPreferences)
    window.dispatchEvent(new Event('nw-reader-state-change'))
  })
}

/**
 * Dense picks rail (thumb + category + headline + deck), same packing language as ताजा.
 * Cold-start without consent shows editorial freshness, not a fake “for you” feed.
 */
export function RecommendedForYou({
  locale,
  catalog,
  className,
  excludeIds,
}: {
  locale: Locale
  catalog: StoryCardData[]
  className?: string
  /** Homepage lead / secondary already shown above; keep this band distinct. */
  excludeIds?: ReadonlySet<string>
}) {
  const [enabled, setEnabled] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const [preferences, setPreferences] = useState<ReaderPreferences | null>(null)
  const [serverOrder, setServerOrder] = useState<Array<{ id: string; recStrategy: RecStrategy }> | null>(null)
  const lang = locale === 'en' ? 'en' : 'ne'
  const english = locale === 'en'

  useEffect(() => {
    function refresh() {
      setEnabled(hasPersonalizationConsent())
      setBookmarks(safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)))
      setHistory(safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY)))
      setPreferences(readLocalReaderPreferences())
    }
    refresh()
    if (hasPersonalizationConsent()) {
      void syncFromServer(catalog, locale).catch(() => undefined)
      void fetchServerOrder(locale).then(setServerOrder).catch(() => setServerOrder(null))
    }
    window.addEventListener(CONSENT_EVENT, refresh)
    window.addEventListener(READER_PREFERENCES_EVENT, refresh)
    window.addEventListener('nw-reader-state-change', refresh)
    return () => {
      window.removeEventListener(CONSENT_EVENT, refresh)
      window.removeEventListener(READER_PREFERENCES_EVENT, refresh)
      window.removeEventListener('nw-reader-state-change', refresh)
    }
  }, [catalog, locale])

  const localRecommendations = useMemo(
    () =>
      enabled
        ? recommendForReader(catalog, bookmarks, history, 8, preferences)
        : recommendForReader(catalog, [], [], 8, null),
    [bookmarks, catalog, enabled, history, preferences],
  )

  const recommendations = useMemo(() => {
    const blocked = excludeIds ?? new Set<string>()
    const source =
      enabled && serverOrder && serverOrder.length > 0
        ? (() => {
            const byId = new Map(catalog.map((story) => [story.id, story]))
            const resolved = serverOrder.flatMap((item) => {
              const story = byId.get(item.id)
              return story
                ? [{ ...story, recScore: 0, recStrategy: item.recStrategy, recVersion: RECOMMENDER_VERSION }]
                : []
            })
            return resolved.length > 0 ? resolved : localRecommendations
          })()
        : localRecommendations

    return source.filter((story) => !blocked.has(story.id)).slice(0, 8)
  }, [catalog, enabled, excludeIds, localRecommendations, serverOrder])

  const unfinished = useMemo(
    () => (enabled ? continueReadingForReader(catalog, history) : null),
    [catalog, enabled, history],
  )
  const digest = useMemo(() => {
    if (!enabled || !preferences?.dailyDigest) return []
    const affinity = buildAffinity(bookmarks, history, catalog, preferences)
    const recommendedIds = new Set(recommendations.map((item) => item.id))
    return rankDigestStories(catalog, affinity, { limit: 3 }).filter((story) => !recommendedIds.has(story.id))
  }, [bookmarks, catalog, enabled, history, preferences, recommendations])

  function enable() {
    mergeConsent({ personalization: true })
    void syncFromServer(catalog, locale).catch(() => undefined)
    void fetchServerOrder(locale).then(setServerOrder).catch(() => setServerOrder(null))
  }

  if (recommendations.length === 0) return null

  const title = enabled
    ? english
      ? 'For you'
      : 'तपाईंका लागि'
    : english
      ? 'More to read'
      : 'थप पढ्नुहोस्'

  return (
    <section
      className={`recommendation-desk ${className ?? ''}`}
      aria-labelledby="recommendation-desk-title"
    >
      <header className="recommendation-desk__header">
        <div className="min-w-0">
          <h2 id="recommendation-desk-title" className="font-display text-h3 font-extrabold text-ink" lang={lang}>
            {title}
          </h2>
          <span className="mt-1 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
        <div className="recommendation-desk__controls">
          {!enabled ? (
            <button type="button" onClick={enable} className="text-meta font-bold text-brand-strong underline-offset-4 hover:underline" lang={lang}>
              {english ? 'Personalize' : 'व्यक्तिगत'}
            </button>
          ) : (
            <Link
              href={localizeHref(locale, '/how-recommendations-work')}
              className="text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
              lang={lang}
            >
              {english ? 'How ranking works' : 'क्रम कसरी'}
            </Link>
          )}
        </div>
      </header>

      {unfinished ? (
        <Link
          href={localizeHref(locale, `/${unfinished.category.slug}/${unfinished.slug}`)}
          className="recommendation-desk__continue"
          lang={lang}
        >
          <span>{english ? 'Continue' : 'जारी'}</span>
          <strong className="line-clamp-1">
            {english && unfinished.titleEn ? unfinished.titleEn : unfinished.titleNe}
          </strong>
        </Link>
      ) : null}

      <ol className="recommendation-desk__grid">
        {recommendations.map((story) => {
          const itemTitle = english && story.titleEn ? story.titleEn : story.titleNe
          const titleLang = english && story.titleEn ? 'en' : 'ne'
          const deck = english ? story.deckEn : story.deckNe
          const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
          const image = story.heroImage
          const showThumb = isRealPhoto(image?.url)

          return (
            <li key={story.id} className="recommendation-desk__item">
              <article
                className={`group ${showThumb ? 'grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2.5 sm:grid-cols-[5rem_minmax(0,1fr)]' : ''}`}
              >
                {showThumb ? (
                  <Link
                    href={href}
                    className="relative aspect-[4/3] shrink-0 overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={image!.url}
                      alt=""
                      fill
                      unoptimized={image!.url.startsWith('data:')}
                      sizes="80px"
                      className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
                    />
                  </Link>
                ) : null}
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
                    <span className="font-bold text-brand-strong" lang={lang}>
                      {english && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
                    </span>
                    <span className="text-mute" aria-hidden="true">
                      ·
                    </span>
                    <Dateline iso={story.publishedAt} locale={locale} />
                  </div>
                  <h3 className="mt-0.5 font-display text-body font-bold leading-snug text-ink sm:text-body-lg">
                    <Link
                      href={href}
                      className="cursor-pointer transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      lang={titleLang}
                    >
                      <span className="line-clamp-2 text-pretty">{itemTitle}</span>
                    </Link>
                  </h3>
                  {deck ? (
                    <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft sm:text-meta" lang={titleLang}>
                      {deck}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          )
        })}
      </ol>

      {digest.length ? (
        <div className="recommendation-desk__digest" aria-label={english ? 'Daily digest' : 'दैनिक सार'}>
          <p className="text-meta font-bold text-brand-strong" lang={lang}>
            {english ? 'Digest' : 'सार'}
          </p>
          <ol>
            {digest.map((story) => (
              <li key={story.id}>
                <Link href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)} lang={lang}>
                  {english && story.titleEn ? story.titleEn : story.titleNe}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
