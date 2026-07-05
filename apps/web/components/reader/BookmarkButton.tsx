'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { READER_BOOKMARKS_KEY, safeParseArray, toggleBookmark, type BookmarkRecord } from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'

type BookmarkStory = Pick<StoryCardData, 'id' | 'slug' | 'category' | 'titleNe'> & Partial<StoryCardData>

export function BookmarkButton({ story, locale, variant = 'icon' }: { story: BookmarkStory; locale: Locale; variant?: 'icon' | 'pill' }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const local = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    setBookmarked(local.some((record) => record.articleId === story.id || record.story.slug === story.slug))
    const fp = getOrCreateReaderId()
    if (!fp) return
    fetch(`/api/bookmarks?fingerprint=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then((data: { bookmarks?: { articleSlug: string }[] }) => {
        if ((data.bookmarks ?? []).some((b) => b.articleSlug === story.slug)) setBookmarked(true)
      })
      .catch(() => {})
  }, [story.id, story.slug])

  function persistLocal(nextBookmarked: boolean) {
    if (!('authors' in story) || !('publishedAt' in story)) return
    const records = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    const next = toggleBookmark(records, story as StoryCardData)
    localStorage.setItem(READER_BOOKMARKS_KEY, JSON.stringify(next))
    setBookmarked(nextBookmarked)
    window.dispatchEvent(new Event('nw-reader-state-change'))
  }

  function toggle() {
    const nextBookmarked = !bookmarked
    persistLocal(nextBookmarked)
    const fp = getOrCreateReaderId()
    if (!fp) return
    startTransition(async () => {
      try {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: nextBookmarked ? 'add' : 'remove', fingerprint: fp, articleSlug: story.slug, articleCategory: story.category.slug, articleTitleNe: story.titleNe }),
        })
      } catch {}
    })
  }

  const en = locale === 'en'
  const label = bookmarked ? (en ? 'Saved' : 'सुरक्षित') : (en ? 'Save' : 'सुरक्षित गर्नुहोस्')

  if (variant === 'pill') {
    return (
      <button type="button" onClick={toggle} disabled={pending} aria-pressed={bookmarked} className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-meta font-semibold transition-colors duration-fast ease-out-quint focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-50 ${bookmarked ? 'bg-brand text-surface' : 'border border-rule text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-strong'}`} lang={en ? 'en' : 'ne'}>
        <BookmarkIcon filled={bookmarked} />{label}
      </button>
    )
  }
  return (
    <button type="button" onClick={toggle} disabled={pending} aria-pressed={bookmarked} aria-label={label} title={label} className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-fast ease-out-quint focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-50 ${bookmarked ? 'bg-brand-tint text-brand-strong' : 'text-ink-soft hover:bg-brand-tint hover:text-brand-strong'}`}>
      <BookmarkIcon filled={bookmarked} />
    </button>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
}
