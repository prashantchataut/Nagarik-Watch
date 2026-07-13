'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  READER_BOOKMARKS_KEY,
  safeParseArray,
  type BookmarkRecord,
} from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'

type SavedItem = {
  slug: string
  category: string
  titleNe: string
  titleEn?: string
  savedAt: string
  source: 'device' | 'account'
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
    <section className="mx-auto max-w-page px-4 py-10">
      <header className="border-y border-rule py-7">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">Reader library</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-display font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
              {ne ? 'तपाईंका सुरक्षित समाचार' : 'Your saved stories'}
            </h1>
            <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne ? 'खातामा सिंक भएका र यो उपकरणमा सुरक्षित गरिएका समाचार एउटै सूचीमा।' : 'Account-synced and device-saved stories in one list.'}
            </p>
          </div>
          <span className="rounded-full border border-rule px-3 py-1.5 text-meta font-semibold text-ink-soft">{countLabel}</span>
        </div>
      </header>

      {syncError ? (
        <p role="status" className="mt-5 rounded-md border border-rule bg-surface-raised p-3 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'खाता सिंक अहिले उपलब्ध छैन; उपकरणमा सुरक्षित सूची भने काम गरिरहेको छ।' : 'Account sync is unavailable; the device-saved list is still working.'}
        </p>
      ) : null}

      <div className="mt-6 divide-y divide-rule border-y border-rule">
        {stories.length ? stories.map((story) => {
          const title = (!ne && story.titleEn) || story.titleNe || story.slug
          const href = `${ne ? '' : '/en'}/${story.category}/${story.slug}`
          return (
            <article key={story.slug} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <a href={href} className="font-display text-h2 font-bold text-ink hover:text-brand-strong">{title}</a>
                <p className="mt-1 text-caption text-mute">
                  {new Date(story.savedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')} · {story.source === 'account' ? (ne ? 'खाता सिंक' : 'Account sync') : (ne ? 'यो उपकरण' : 'This device')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeStory(story)}
                disabled={pending}
                className="w-fit rounded-full border border-rule px-3.5 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong disabled:opacity-60"
              >
                {ne ? 'हटाउनुहोस्' : 'Remove'}
              </button>
            </article>
          )
        }) : (
          <div className="py-10 text-center">
            <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
              {ready ? (ne ? 'अहिले कुनै सुरक्षित समाचार छैन।' : 'No saved stories yet.') : (ne ? 'लोड हुँदै…' : 'Loading…')}
            </h2>
            <p className="mx-auto mt-2 max-w-body text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne ? 'लेखमा रहेको सुरक्षित गर्नुहोस् बटन थिचेपछि यहाँ देखिन्छ।' : 'Use the save button on an article and it will appear here.'}
            </p>
          </div>
        )}
      </div>

      {stories.length ? (
        <button type="button" onClick={clearAll} disabled={pending} className="mt-6 rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong disabled:opacity-60">
          {ne ? 'सबै हटाउनुहोस्' : 'Clear saved list'}
        </button>
      ) : null}
    </section>
  )
}
