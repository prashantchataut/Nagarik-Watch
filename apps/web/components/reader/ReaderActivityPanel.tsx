'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'

export function ReaderActivityPanel({ locale }: { locale: Locale }) {
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const english = locale === 'en'

  useEffect(() => {
    const refresh = () => {
      setHistory(safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY)))
      setBookmarks(safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)))
    }
    refresh()
    window.addEventListener('nw-reader-state-change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('nw-reader-state-change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const completed = history.filter((item) => item.completed).length
  const recent = [...history].sort((a, b) => b.readAt.localeCompare(a.readAt)).slice(0, 5)

  return (
    <section className="rounded-lg border border-rule bg-surface-raised p-5" lang={english ? 'en' : 'ne'}>
      <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong" lang="en">Reader activity</p>
      <h2 className="mt-1 font-display text-h1 text-ink">{english ? 'Reading history' : 'पढाइ इतिहास'}</h2>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-rule py-4 text-center">
        <div><dt className="text-caption text-mute">{english ? 'Opened' : 'खोलिएको'}</dt><dd className="font-display text-h1 text-ink">{history.length}</dd></div>
        <div><dt className="text-caption text-mute">{english ? 'Completed' : 'पूरा'}</dt><dd className="font-display text-h1 text-ink">{completed}</dd></div>
        <div><dt className="text-caption text-mute">{english ? 'Saved' : 'सुरक्षित'}</dt><dd className="font-display text-h1 text-ink">{bookmarks.length}</dd></div>
      </dl>
      {recent.length ? (
        <ol className="mt-4 divide-y divide-rule">
          {recent.map((item) => (
            <li key={item.articleId} className="py-3">
              <a href={item.href} className="font-display text-h3 text-ink hover:text-brand-strong">{item.title}</a>
              <p className="mt-1 text-caption text-mute">{item.scrollDepth}% · {new Date(item.readAt).toLocaleString(english ? 'en-GB' : 'ne-NP')}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-body text-ink-soft">{english ? 'Reading history is stored on this device after you open an article.' : 'लेख खोलेपछि पढाइ इतिहास यो उपकरणमा सुरक्षित हुन्छ।'}</p>
      )}
    </section>
  )
}
