'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import {
  READER_HISTORY_KEY,
  safeParseArray,
  upsertHistory,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { remainingReadingMinutes } from '@/lib/reader/reading'

type ReaderArticleControlsProps = {
  story: StoryCardData
  locale: Locale
  title: string
  href: string
  readingMinutes: number
}

export function ReaderArticleControls({
  story,
  locale,
  title,
  href,
  readingMinutes,
}: ReaderArticleControlsProps) {
  const [readingMode, setReadingMode] = useState(false)
  const [scrollDepth, setScrollDepth] = useState(0)
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    const startedAt = Date.now()
    let maxDepth = 0

    function currentDepth() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return 100
      return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
    }

    function record() {
      maxDepth = Math.max(maxDepth, currentDepth())
      setScrollDepth(maxDepth)
    }

    function persist() {
      record()
      const previous = safeParseArray<ReadingHistoryRecord>(
        localStorage.getItem(READER_HISTORY_KEY),
      )
      const next = upsertHistory(previous, {
        articleId: story.id,
        slug: story.slug,
        categorySlug: story.category.slug,
        title,
        href,
        readAt: new Date().toISOString(),
        scrollDepth: Math.round(maxDepth),
        completed: maxDepth >= 92,
        readingMinutes,
        dwellSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      })
      localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(next))
    }

    record()
    window.addEventListener('scroll', record, { passive: true })
    window.addEventListener('pagehide', persist)
    const interval = window.setInterval(persist, 15_000)
    return () => {
      persist()
      window.removeEventListener('scroll', record)
      window.removeEventListener('pagehide', persist)
      window.clearInterval(interval)
    }
  }, [href, readingMinutes, story.category.slug, story.id, story.slug, title])

  useEffect(() => {
    document.documentElement.classList.toggle('reader-focus-mode', readingMode)
    return () => document.documentElement.classList.remove('reader-focus-mode')
  }, [readingMode])

  const remaining = useMemo(
    () => remainingReadingMinutes(readingMinutes, scrollDepth),
    [readingMinutes, scrollDepth],
  )

  const modeLabel = readingMode
    ? locale === 'en'
      ? 'Exit reader view'
      : 'पढाइ दृश्य बन्द'
    : locale === 'en'
      ? 'Reader view'
      : 'पढाइ दृश्य'

  return (
    <div className="flex flex-wrap items-center gap-2" lang={lang}>
      <button
        type="button"
        onClick={() => setReadingMode((value) => !value)}
        aria-pressed={readingMode}
        className="inline-flex min-h-10 items-center rounded-full border border-rule px-3.5 py-2 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong active:scale-[0.98]"
      >
        {modeLabel}
      </button>
      <span className="rounded-full bg-surface-raised px-3 py-2 text-caption text-mute">
        {locale === 'en' ? `${remaining} min left` : `${remaining} मिनेट बाँकी`}
      </span>
    </div>
  )
}
