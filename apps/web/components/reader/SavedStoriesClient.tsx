'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { READER_BOOKMARKS_KEY, safeParseArray, type BookmarkRecord } from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { rankSavedForLater, savedEmptyState } from '@/lib/reader/saves'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

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
  return safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)).map(
    (record) => ({
      slug: record.story.slug,
      category: record.story.category.slug,
      titleNe: record.story.titleNe,
      titleEn: record.story.titleEn,
      savedAt: record.savedAt,
      source: 'device',
      readingMinutes: record.story.readingMinutes,
    }),
  )
}

function mergeItems(local: SavedItem[], account: SavedItem[]): SavedItem[] {
  const merged = new Map<string, SavedItem>()
  for (const item of [...account, ...local]) {
    const previous = merged.get(item.slug)
    merged.set(
      item.slug,
      previous
        ? {
            ...previous,
            ...item,
            source:
              previous.source === 'account' || item.source === 'account' ? 'account' : 'device',
          }
        : item,
    )
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
    if (!hasLivePublicApi()) {
      setReady(true)
      return
    }
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
      .catch(() => {
        if (!cancelled) setSyncError(true)
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

  const orderedStories = useMemo(
    () => rankSavedForLater(stories).map((item) => item.bookmark),
    [stories],
  )
  const emptyState = useMemo(() => savedEmptyState(stories), [stories])

  function removeStory(item: SavedItem) {
    const next = stories.filter((story) => story.slug !== item.slug)
    setStories(next)
    const local = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    localStorage.setItem(
      READER_BOOKMARKS_KEY,
      JSON.stringify(local.filter((record) => record.story.slug !== item.slug)),
    )
    if (!hasLivePublicApi()) return
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
      } catch {
        setSyncError(true)
      }
    })
  }

  function clearAll() {
    const current = stories
    setStories([])
    localStorage.removeItem(READER_BOOKMARKS_KEY)
    if (!hasLivePublicApi()) return
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
    <main className="saved-library mx-auto max-w-page px-3 py-5 sm:px-4 sm:py-7" lang={ne ? 'ne' : 'en'}>
      <HubIndexHeader
        title={ne ? 'सुरक्षित समाचार' : 'Saved stories'}
        lead={
          ne
            ? 'फेरि पढ्न चाहेका समाचारको निजी सूची। उपकरणमा तुरुन्त सुरक्षित हुन्छ; उपलब्ध हुँदा खातासँग सिङ्क हुन्छ।'
            : 'A private reading list for stories you want to return to. Saves stay on this device and sync to your account when available.'
        }
        lang={ne ? 'ne' : 'en'}
        kicker={ne ? 'पढाइ संग्रह' : 'Reading library'}
      />

      <div className="saved-library__toolbar">
        <p>{countLabel}</p>
        <nav aria-label={ne ? 'पढाइ संग्रह नेभिगेसन' : 'Reading library navigation'}>
          <Link href={localizeHref(locale, '/reader-corner')}>
            {ne ? 'पढाइ डेस्क' : 'Reading desk'}
          </Link>
          <Link href={localizeHref(locale, '/auth/profile')}>{ne ? 'खाता' : 'Account'}</Link>
        </nav>
        {stories.length ? (
          <button type="button" onClick={clearAll} disabled={pending}>
            {ne ? 'सबै हटाउनुहोस्' : 'Clear all'}
          </button>
        ) : null}
      </div>

      {syncError ? (
        <p role="status" className="saved-library__notice">
          {ne
            ? 'खाता सिङ्क अहिले उपलब्ध छैन। यस उपकरणको सुरक्षित सूची भने काम गरिरहन्छ।'
            : 'Account sync is unavailable right now. Your device reading list still works.'}
        </p>
      ) : null}

      {emptyState === 'all-stale' ? (
        <p role="status" className="saved-library__stale">
          {ne
            ? 'सबै सुरक्षित समाचार ३० दिनभन्दा पुराना छन्। चाहिँदैन भने सूची खाली गर्न सक्नुहुन्छ।'
            : 'All saved stories are older than 30 days. Clear the list if you no longer need them.'}
        </p>
      ) : null}

      {orderedStories.length ? (
        <ol className="saved-library__list">
          {orderedStories.map((story, index) => {
            const title = (!ne && story.titleEn) || story.titleNe || story.slug
            const href = localizeHref(locale, `/${story.category}/${story.slug}`)
            const sourceLabel =
              story.source === 'account'
                ? ne
                  ? 'खाता + उपकरण'
                  : 'Account + device'
                : ne
                  ? 'यस उपकरणमा'
                  : 'On this device'
            return (
              <li key={story.slug}>
                <span className="saved-library__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="saved-library__story">
                  <p>
                    {sourceLabel} · {new Date(story.savedAt).toLocaleDateString(ne ? 'ne-NP' : 'en-GB')}
                    {story.readingMinutes ? ` · ${story.readingMinutes} ${ne ? 'मिनेट' : 'min'}` : ''}
                  </p>
                  <Link href={href}>{title}</Link>
                </div>
                <button
                  type="button"
                  onClick={() => removeStory(story)}
                  disabled={pending}
                  aria-label={ne ? `${title} हटाउनुहोस्` : `Remove ${title}`}
                >
                  {ne ? 'हटाउनुहोस्' : 'Remove'}
                </button>
              </li>
            )
          })}
        </ol>
      ) : (
        <section className="saved-library__empty" aria-live="polite">
          <p>{ready ? (ne ? 'सूची खाली छ' : 'Your list is empty') : ne ? 'लोड हुँदै…' : 'Loading…'}</p>
          <h2>
            {ready
              ? ne
                ? 'पढ्न बाँकी समाचार यहाँ राख्नुहोस्'
                : 'Keep stories here for later'
              : ne
                ? 'सुरक्षित समाचार खोजिँदैछ'
                : 'Finding your saved stories'}
          </h2>
          <span>
            {ne
              ? 'समाचार पढ्दा “सुरक्षित” थिचेपछि त्यो कथा यही सूचीमा आउँछ।'
              : 'Tap save on any article and it will appear in this reading list.'}
          </span>
          {ready ? (
            <Link href={localizeHref(locale, '/latest')}>
              {ne ? 'ताजा समाचार खोल्नुहोस्' : 'Browse latest stories'}
            </Link>
          ) : null}
        </section>
      )}
    </main>
  )
}
