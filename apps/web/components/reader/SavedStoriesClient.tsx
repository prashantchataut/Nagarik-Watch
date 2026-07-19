'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  READER_BOOKMARKS_KEY,
  safeParseArray,
  type BookmarkRecord,
} from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'
import { rankSavedForLater, savedEmptyState } from '@/lib/reader/saves'

type SavedItem = {
  slug: string
  category: string
  titleNe: string
  titleEn?: string
  savedAt: string
  source: 'device' | 'account'
  readingMinutes?: number
}

type ApiBookmark = {
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  createdAt: string
}

function localItems(): SavedItem[] {
  return safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)).map((record) => ({
    slug: record.story.slug,
    category: record.story.category.slug,
    titleNe: record.story.titleNe,
    titleEn: record.story.titleEn,
    savedAt: record.savedAt,
    source: 'device',
    readingMinutes: record.story.readingMinutes,
  }))
}

function mergeItems(local: SavedItem[], account: SavedItem[]): SavedItem[] {
  const merged = new Map<string, SavedItem>()
  for (const item of [...account, ...local]) {
    const previous = merged.get(item.slug)
    merged.set(item.slug, previous ? { ...previous, ...item, source: previous.source === 'account' || item.source === 'account' ? 'account' : 'device' } : item)
  }
  return [...merged.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function SavedStoriesClient({ locale }: { locale: 'ne' | 'en' }) {
  const ne = locale === 'ne'
  const [stories, setStories] = useState<SavedItem[]>([])
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const local = localItems()
    setStories(local)
    const fingerprint = getOrCreateReaderId()
    if (!fingerprint) {
      setReady(true)
      return
    }
    fetch(`/api/bookmarks?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Bookmark list failed: ${response.status}`)
        return response.json() as Promise<{ bookmarks?: ApiBookmark[] }>
      })
      .then((body) => {
        if (cancelled) return
        const account = (body.bookmarks ?? []).map<SavedItem>((bookmark) => ({
          slug: bookmark.articleSlug,
          category: bookmark.articleCategory,
          titleNe: bookmark.articleTitleNe,
          savedAt: bookmark.createdAt,
          source: 'account',
        }))
        setStories(mergeItems(local, account))
        setSyncError(false)
      })
      .catch((error) => {
        if (!cancelled) setSyncError(true)
        void error
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const countLabel = useMemo(() => {
    if (!ready) return ne ? 'लोड हुँदै…' : 'Loading…'
    return ne ? `${stories.length} सुरक्षित कथा` : `${stories.length} saved stories`
  }, [ne, ready, stories.length])

  // Shorter, fresher saves surface first — the same "worth reading now" signal
  // as the save-later-ranking heuristic, computed from real savedAt/readingMinutes.
  const orderedStories = useMemo(() => rankSavedForLater(stories).map((item) => item.bookmark), [stories])
  const emptyState = useMemo(() => savedEmptyState(stories), [stories])

  function removeStory(item: SavedItem) {
    const next = stories.filter((story) => story.slug !== item.slug)
    setStories(next)
    const local = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    localStorage.setItem(
      READER_BOOKMARKS_KEY,
      JSON.stringify(local.filter((record) => record.story.slug !== item.slug)),
    )
    const fingerprint = getOrCreateReaderId()
    if (!fingerprint) return
    startTransition(async () => {
      try {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'remove',
            fingerprint,
            articleSlug: item.slug,
            articleCategory: item.category,
          }),
        })
        if (!response.ok) throw new Error(`Bookmark removal failed: ${response.status}`)
      } catch (error) {
        setSyncError(true)
        void error
      }
    })
  }

  function clearAll() {
    const current = stories
    setStories([])
    localStorage.removeItem(READER_BOOKMARKS_KEY)
    const fingerprint = getOrCreateReaderId()
    if (!fingerprint) return
    startTransition(async () => {
      const results = await Promise.allSettled(
        current.map((story) =>
          fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action: 'remove',
              fingerprint,
              articleSlug: story.slug,
              articleCategory: story.category,
            }),
          }).then((response) => {
            if (!response.ok) throw new Error(`Bookmark removal failed: ${response.status}`)
          }),
        ),
      )
      setSyncError(results.some((result) => result.status === 'rejected'))
    })
  }

  return (
    <section className="account-page account-page--wide">
      <header className="account-page__header">
        <h1 lang={ne ? 'ne' : 'en'}>{ne ? 'सुरक्षित समाचार' : 'Saved stories'}</h1>
        <p className="account-page__email" style={{ wordBreak: 'normal' }} lang={ne ? 'ne' : 'en'}>
          {ready
            ? countLabel
            : ne
              ? 'लोड हुँदै…'
              : 'Loading…'}
        </p>
      </header>

      {syncError ? (
        <p role="status" className="account-card__ok" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'खाता सिंक अहिले उपलब्ध छैन; उपकरणको सूची काम गर्छ।'
            : 'Account sync is unavailable; the device list still works.'}
        </p>
      ) : null}

      {emptyState === 'all-stale' ? (
        <p role="status" className="account-card__ok" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'सबै सुरक्षित समाचार ३० दिनभन्दा पुराना छन्।'
            : 'All saves are older than 30 days.'}
        </p>
      ) : null}

      <div className="account-page__links">
        {orderedStories.length ? (
          orderedStories.map((story) => {
            const title = (!ne && story.titleEn) || story.titleNe || story.slug
            const href = `${ne ? '' : '/en'}/${story.category}/${story.slug}`
            return (
              <article key={story.slug} className="account-page__link" style={{ gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
                <div>
                  <a href={href} className="account-page__link-title">
                    {title}
                  </a>
                  <p className="account-page__link-body">
                    {new Date(story.savedAt).toLocaleDateString(ne ? 'ne-NP' : 'en-GB')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStory(story)}
                  disabled={pending}
                  className="account-btn account-btn--ghost"
                >
                  {ne ? 'हटाउनुहोस्' : 'Remove'}
                </button>
              </article>
            )
          })
        ) : (
          <div className="py-8">
            <p className="account-page__link-title" lang={ne ? 'ne' : 'en'}>
              {ready
                ? ne
                  ? 'अहिले कुनै सुरक्षित समाचार छैन।'
                  : 'No saved stories yet.'
                : ne
                  ? 'लोड हुँदै…'
                  : 'Loading…'}
            </p>
            <p className="account-page__link-body mt-2" lang={ne ? 'ne' : 'en'}>
              {ne
                ? 'लेखमा सुरक्षित गर्नुहोस् थिचेपछि यहाँ देखिन्छ।'
                : 'Tap save on an article and it will show up here.'}
            </p>
          </div>
        )}
      </div>

      {stories.length ? (
        <button
          type="button"
          onClick={clearAll}
          disabled={pending}
          className="account-btn account-btn--ghost mt-4"
        >
          {ne ? 'सबै हटाउनुहोस्' : 'Clear all'}
        </button>
      ) : null}
    </section>
  )
}
