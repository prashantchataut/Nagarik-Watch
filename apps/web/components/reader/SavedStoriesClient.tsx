'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  READER_BOOKMARKS_KEY,
  safeParseArray,
  type BookmarkRecord,
} from '@/lib/reader/state'
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
    merged.set(
      item.slug,
      previous
        ? {
            ...previous,
            ...item,
            source: previous.source === 'account' || item.source === 'account' ? 'account' : 'device',
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
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader
        title={ne ? 'सुरक्षित समाचार' : 'Saved stories'}
        lead={
          ne
            ? 'लेखमा सुरक्षित थिचेपछि यहाँ देखिन्छ। पढाइ डेस्क र खातासँग जोडिएको तपाईंको व्यक्तिगत सूची।'
            : 'Stories you save on articles appear here. This is your personal list connected to the reading desk and account.'
        }
        lang={ne ? 'ne' : 'en'}
        kicker={ne ? 'पाठक खाता' : 'Reader account'}
      />

      <p className="mt-4 text-meta font-semibold text-ink-soft" lang={ne ? 'ne' : 'en'}>
        {countLabel}
      </p>

      <nav className="mt-4 flex flex-wrap gap-4" aria-label={ne ? 'सुरक्षित समाचार लिंक' : 'Saved story links'}>
        <Link
          href={localizeHref(locale, '/reader-corner')}
          className="inline-flex items-center border-b border-rule pb-1 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          {ne ? 'पढाइ डेस्क' : 'Reading desk'}
        </Link>
        <Link
          href={localizeHref(locale, '/auth/profile')}
          className="inline-flex items-center border-b border-rule pb-1 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          {ne ? 'खाता' : 'Account'}
        </Link>
      </nav>

      <section className="mt-6 border-y border-rule bg-surface-raised px-4 py-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-caption font-semibold text-mute">{ne ? 'सूची प्रकार' : 'List type'}</p>
            <p className="mt-1 font-display text-h3 text-ink">{ne ? 'फेरि पढ्न' : 'Read later'}</p>
          </div>
          <div>
            <p className="text-caption font-semibold text-mute">{ne ? 'उपकरण स्थिति' : 'Device status'}</p>
            <p className="mt-1 text-body text-ink-soft">
              {ne
                ? 'स्थानीय सुरक्षित सूची तुरुन्तै काम गर्छ, खाता सिङ्क उपलब्ध हुँदा त्यो पनि जोडिन्छ।'
                : 'Local saves work immediately, with account sync merging in when available.'}
            </p>
          </div>
          <div>
            <p className="text-caption font-semibold text-mute">{ne ? 'सम्बन्धित ठाउँ' : 'Related areas'}</p>
            <p className="mt-1 text-body text-ink-soft">
              {ne
                ? 'पढाइ इतिहास र सिफारिसका लागि पढाइ डेस्क हेर्नुहोस्।'
                : 'Open the reading desk for history, recommendations and alerts.'}
            </p>
          </div>
        </div>
      </section>

      {syncError ? (
        <p role="status" className="mt-3 border border-rule bg-surface-raised px-3 py-2 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'खाता सिंक अहिले उपलब्ध छैन; उपकरणको सूची काम गर्छ।'
            : 'Account sync is unavailable; the device list still works.'}
        </p>
      ) : null}

      {emptyState === 'all-stale' ? (
        <p role="status" className="mt-3 text-meta text-mute" lang={ne ? 'ne' : 'en'}>
          {ne ? 'सबै सुरक्षित समाचार ३० दिनभन्दा पुराना छन्।' : 'All saves are older than 30 days.'}
        </p>
      ) : null}

      <div className="mt-6 divide-y divide-rule border-y border-rule">
        {orderedStories.length ? (
          orderedStories.map((story) => {
            const title = (!ne && story.titleEn) || story.titleNe || story.slug
            const href = localizeHref(locale, `/${story.category}/${story.slug}`)
            return (
              <article key={story.slug} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-mute">
                    {story.source === 'account'
                      ? ne
                        ? 'खाता + उपकरण'
                        : 'Account + device'
                      : ne
                        ? 'उपकरण'
                        : 'Device'}
                  </p>
                  <Link
                    href={href}
                    className="mt-1 block font-display text-body-lg font-bold leading-snug text-ink transition-colors hover:text-brand-strong"
                  >
                    {title}
                  </Link>
                  <p className="mt-1 text-caption text-mute">
                    {new Date(story.savedAt).toLocaleDateString(ne ? 'ne-NP' : 'en-GB')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStory(story)}
                  disabled={pending}
                  className="shrink-0 border border-rule px-3 py-2 text-caption font-bold text-ink-soft hover:border-breaking hover:text-breaking"
                >
                  {ne ? 'हटाउनुहोस्' : 'Remove'}
                </button>
              </article>
            )
          })
        ) : (
          <div className="py-10">
            <p className="font-display text-h3 font-bold text-ink" lang={ne ? 'ne' : 'en'}>
              {ready
                ? ne
                  ? 'अहिले कुनै सुरक्षित समाचार छैन।'
                  : 'No saved stories yet.'
                : ne
                  ? 'लोड हुँदै…'
                  : 'Loading…'}
            </p>
            <p className="mt-2 max-w-xl text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne
                ? 'कुनै समाचार खोल्नुहोस् र सुरक्षित गर्नुहोस् थिच्नुहोस्।'
                : 'Open any story and tap save to keep it here.'}
            </p>
            <Link
              href={localizeHref(locale, '/latest')}
              className="mt-5 inline-flex min-h-11 items-center bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
              lang={ne ? 'ne' : 'en'}
            >
              {ne ? 'ताजा समाचार हेर्नुहोस्' : 'Browse latest'}
            </Link>
          </div>
        )}
      </div>

      {stories.length ? (
        <button
          type="button"
          onClick={clearAll}
          disabled={pending}
          className="mt-5 border border-rule px-4 py-2 text-meta font-bold text-ink-soft hover:border-breaking hover:text-breaking"
        >
          {ne ? 'सबै हटाउनुहोस्' : 'Clear all'}
        </button>
      ) : null}
    </div>
  )
}
