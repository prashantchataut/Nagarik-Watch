'use client'

import { useEffect, useMemo, useState } from 'react'
import { RECOMMENDER_VERSION, type Locale, type RecStrategy, type StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import Link from 'next/link'
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

type ServerBookmark = { articleSlug: string; articleCategory: string; articleTitleNe: string; createdAt: string }
type ServerHistory = { articleSlug: string; articleCategory: string; articleTitleNe: string; articleTagSlugs?: string[]; articleAuthorSlugs?: string[]; readPercent: number; dwellSeconds: number; completed: boolean; sessions: number; firstReadAt: string; readAt: string }

function reasonLabel(strategy: RecStrategy, locale: Locale) {
  const ne = locale === 'ne'
  const labels: Record<RecStrategy, string> = {
    content: ne ? 'तपाईंले पढेका विषयसँग मिल्दो' : 'Matches your reading interests',
    session: ne ? 'अहिलेको पढाइसँग सम्बन्धित' : 'Related to this reading session',
    sequence: ne ? 'हालको पढाइपछि उपयोगी हुन सक्ने' : 'Suggested by your recent reading sequence',
    collaborative: ne ? 'समान पढाइ ढाँचाबाट' : 'From similar reading patterns',
    freshness: ne ? 'ताजा र उपयोगी' : 'Fresh and useful',
    follow: ne ? 'तपाईंले पछ्याएको विषय वा पत्रकार' : 'From a desk or journalist you follow',
    editorial: ne ? 'सम्पादकीय महत्त्व' : 'Editorial priority',
    'cold-start': ne ? 'सम्पादकीय ताजा क्रम' : 'Fresh editorial order',
  }
  return labels[strategy]
}

function fetchServerOrder(locale: Locale): Promise<Array<{ id: string; recStrategy: RecStrategy }> | null> {
  const fingerprint = getOrCreateReaderId()
  return fetch(
    `/api/recommendations/personalized?fingerprint=${encodeURIComponent(fingerprint)}&locale=${locale}&limit=5`,
    { cache: 'no-store' },
  )
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => (Array.isArray(body?.recommendations) ? body.recommendations : null))
}

function syncFromServer(catalog: StoryCardData[], locale: Locale) {
  const fingerprint = getOrCreateReaderId()
  const byRoute = new Map(catalog.map((story) => [`${story.category.slug}:${story.slug}`, story]))
  return Promise.all([
    fetch(`/api/bookmarks?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/reading?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
    fetch(`/api/preferences?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
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
        return [{
          articleId: story?.id ?? `history:${item.articleCategory}:${item.articleSlug}`,
          slug: story?.slug ?? item.articleSlug,
          categorySlug: story?.category.slug ?? item.articleCategory,
          tagSlugs: item.articleTagSlugs ?? [],
          authorSlugs: item.articleAuthorSlugs ?? [],
          title: story
            ? locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
            : item.articleTitleNe,
          href: `${locale === 'en' ? '/en' : ''}/${item.articleCategory}/${item.articleSlug}`,
          readAt: item.readAt,
          firstReadAt: item.firstReadAt,
          scrollDepth: item.readPercent,
          completed: item.completed,
          sessions: item.sessions,
          dwellSeconds: item.dwellSeconds,
        }]
      })
      localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(next))
    }
    if (preferenceBody?.preferences) writeLocalReaderPreferences(preferenceBody.preferences as ReaderPreferences)
    window.dispatchEvent(new Event('nw-reader-state-change'))
  })
}

export function RecommendedForYou({ locale, catalog, className }: { locale: Locale; catalog: StoryCardData[]; className?: string }) {
  const [enabled, setEnabled] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const [preferences, setPreferences] = useState<ReaderPreferences | null>(null)
  const [synced, setSynced] = useState(false)
  // Server-computed order, including consented collaborative filtering, once
  // the consented interaction matrix has enough readers. Null until it
  // resolves; the client-side ranking below renders immediately in the
  // meantime so the module never waits on a network round trip.
  const [serverOrder, setServerOrder] = useState<Array<{ id: string; recStrategy: RecStrategy }> | null>(null)
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    function refresh() {
      setEnabled(hasPersonalizationConsent())
      setBookmarks(safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)))
      setHistory(safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY)))
      setPreferences(readLocalReaderPreferences())
    }
    refresh()
    if (hasPersonalizationConsent()) {
      void syncFromServer(catalog, locale).then(() => setSynced(true)).catch(() => setSynced(false))
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

  const localRecommendations = useMemo(() => enabled ? recommendForReader(catalog, bookmarks, history, 5, preferences) : recommendForReader(catalog, [], [], 5, null), [bookmarks, catalog, enabled, history, preferences])

  const recommendations = useMemo(() => {
    if (!enabled || !serverOrder || serverOrder.length === 0) return localRecommendations
    const byId = new Map(catalog.map((story) => [story.id, story]))
    const resolved = serverOrder.flatMap((item) => {
      const story = byId.get(item.id)
      return story
        ? [{ ...story, recScore: 0, recStrategy: item.recStrategy, recVersion: RECOMMENDER_VERSION }]
        : []
    })
    // Falls back to the local ranking if the server list came back empty or
    // referenced stories outside the client's already-loaded catalog page.
    return resolved.length > 0 ? resolved : localRecommendations
  }, [catalog, enabled, localRecommendations, serverOrder])
  const unfinished = useMemo(() => enabled ? continueReadingForReader(catalog, history) : null, [catalog, enabled, history])
  const digest = useMemo(() => {
    if (!enabled || !preferences?.dailyDigest) return []
    const affinity = buildAffinity(bookmarks, history, catalog, preferences)
    const recommendedIds = new Set(recommendations.map((item) => item.id))
    return rankDigestStories(catalog, affinity, { limit: 3 }).filter((story) => !recommendedIds.has(story.id))
  }, [bookmarks, catalog, enabled, history, preferences, recommendations])

  function enable() {
    mergeConsent({ personalization: true })
    void syncFromServer(catalog, locale).then(() => setSynced(true)).catch(() => setSynced(false))
  }

  if (recommendations.length === 0) return null

  return (
    <section className={`recommendation-desk ${className ?? ''}`} aria-label={locale === 'en' ? 'Recommended for you' : 'तपाईंका लागि सिफारिस'}>
      <header className="recommendation-desk__header">
        <div>
          <p className="editorial-kicker" lang="en">Reader desk · nw-hybrid-v3</p>
          <h2 lang={lang}>{locale === 'en' ? 'A more useful next read' : 'अब पढ्न उपयोगी समाचार'}</h2>
          <p lang={lang}>{enabled
            ? locale === 'en' ? `Ranked from explicit follows, saved stories, reading completion and freshness. ${synced ? 'Account signals are synced.' : 'Using this device until sync returns.'}` : `तपाईंले पछ्याएका विषय, सुरक्षित समाचार, पढाइ पूरा भएको अवस्था र ताजापनका आधारमा। ${synced ? 'खाताको डेटा सिङ्क छ।' : 'सिङ्क नहुँदासम्म यो उपकरणको डेटा प्रयोग हुँदैछ।'}`
            : locale === 'en' ? 'Using transparent editorial freshness until you choose personalization.' : 'तपाईंले व्यक्तिगत सिफारिस नखोलेसम्म पारदर्शी सम्पादकीय ताजा क्रम प्रयोग हुन्छ।'}</p>
        </div>
        <div className="recommendation-desk__controls">
          {!enabled ? <button type="button" onClick={enable} className="text-action" lang={lang}>{locale === 'en' ? 'Enable personal recommendations' : 'व्यक्तिगत सिफारिस खोल्नुहोस्'}</button> : null}
          <Link href={`${locale === 'en' ? '/en' : ''}/how-recommendations-work`} className="text-action" lang={lang}>{locale === 'en' ? 'How this works' : 'यो कसरी काम गर्छ'}</Link>
        </div>
      </header>

      {unfinished ? <a href={`${locale === 'en' ? '/en' : ''}/${unfinished.category.slug}/${unfinished.slug}`} className="recommendation-desk__continue" lang={lang}><span>{locale === 'en' ? 'Continue reading' : 'पढाइ जारी'}</span><strong>{locale === 'en' && unfinished.titleEn ? unfinished.titleEn : unfinished.titleNe}</strong></a> : null}

      <div className="recommendation-desk__grid">
        {recommendations.map((story, index) => (
          <article key={story.id} className="recommendation-desk__item" data-featured={index === 0}>
            <span className="recommendation-desk__reason">{reasonLabel(story.recStrategy, locale)}</span>
            <StoryCard story={story} locale={locale} variant={index === 0 ? 'featured' : 'text-led'} />
          </article>
        ))}
      </div>

      {digest.length ? (
        <div className="recommendation-desk__digest" aria-label={locale === 'en' ? 'Daily digest picks' : 'दैनिक सार छनोट'}>
          <p className="editorial-kicker" lang="en">Daily digest</p>
          <ol>
            {digest.map((story) => (
              <li key={story.id}>
                <a href={`${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`} lang={lang}>
                  {locale === 'en' && story.titleEn ? story.titleEn : story.titleNe}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
