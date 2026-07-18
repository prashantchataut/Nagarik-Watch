'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import {
  READER_BOOKMARKS_KEY,
  safeParseArray,
  setBookmark,
  type BookmarkRecord,
} from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'

type BookmarkStory = Pick<StoryCardData, 'id' | 'slug' | 'category' | 'titleNe'> &
  Partial<StoryCardData>

export function BookmarkButton({
  story,
  locale,
  variant = 'icon',
}: {
  story: BookmarkStory
  locale: Locale
  variant?: 'icon' | 'pill'
}) {
  const [bookmarked, setBookmarked] = useState(false)
  const [pending, startTransition] = useTransition()
  const [syncError, setSyncError] = useState(false)

  useEffect(() => {
    const local = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    setBookmarked(
      local.some((record) => record.articleId === story.id || record.story.slug === story.slug),
    )
    const fp = getOrCreateReaderId()
    if (!fp) return
    fetch(`/api/bookmarks?fingerprint=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then((data: { bookmarks?: { articleSlug: string }[] }) => {
        if (!(data.bookmarks ?? []).some((b) => b.articleSlug === story.slug)) return
        setBookmarked(true)
        if ('authors' in story && 'publishedAt' in story) {
          const records = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
          localStorage.setItem(
            READER_BOOKMARKS_KEY,
            JSON.stringify(setBookmark(records, story as StoryCardData, true)),
          )
          window.dispatchEvent(new Event('nw-reader-state-change'))
        }
      })
      .catch((error) => {
        setSyncError(true)
        void error
      })
  }, [story.id, story.slug])

  function persistLocal(nextBookmarked: boolean) {
    const records = safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY))
    const next = 'authors' in story && 'publishedAt' in story
      ? setBookmark(records, story as StoryCardData, nextBookmarked)
      : records.filter((record) => record.articleId !== story.id && record.story.slug !== story.slug)
    localStorage.setItem(READER_BOOKMARKS_KEY, JSON.stringify(next))
    setBookmarked(nextBookmarked)
    window.dispatchEvent(new Event('nw-reader-state-change'))
  }

  function toggle() {
    const nextBookmarked = !bookmarked
    persistLocal(nextBookmarked)
    const fp = getOrCreateReaderId()
    if (!fp) return
    setSyncError(false)
    startTransition(async () => {
      try {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: nextBookmarked ? 'add' : 'remove',
            fingerprint: fp,
            articleSlug: story.slug,
            articleCategory: story.category.slug,
            articleTitleNe: story.titleNe,
          }),
        })
        if (!response.ok) throw new Error(`Bookmark sync failed: ${response.status}`)
      } catch (error) {
        persistLocal(!nextBookmarked)
        setSyncError(true)
        void error
      }
    })
  }

  const en = locale === 'en'
  const label = bookmarked ? (en ? 'Saved' : 'सुरक्षित') : en ? 'Save' : 'सुरक्षित गर्नुहोस्'
  const syncNote = syncError
    ? en
      ? ' Account sync failed; the change was reverted.'
      : ' खाता सिङ्क भएन; परिवर्तन फिर्ता गरियो।'
    : ''

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={bookmarked}
        className={`article-action-link ${bookmarked ? 'article-action-link--active' : ''}`}
        lang={en ? 'en' : 'ne'}
        title={`${label}${syncNote}`}
      >
        <BookmarkIcon filled={bookmarked} />
        {label}
        {syncError ? <span className="sr-only">{syncNote}</span> : null}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={label}
      title={`${label}${syncNote}`}
      className={`article-icon-action ${bookmarked ? 'article-icon-action--active' : ''}`}
    >
      <BookmarkIcon filled={bookmarked} />
    </button>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  )
}
