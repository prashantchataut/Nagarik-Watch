'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'

type ApiHistory = {
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

function fromApi(item: ApiHistory, locale: Locale): ReadingHistoryRecord {
  return {
    articleId: item.articleSlug,
    slug: item.articleSlug,
    categorySlug: item.articleCategory,
    tagSlugs: item.articleTagSlugs ?? [],
    authorSlugs: item.articleAuthorSlugs ?? [],
    title: item.articleTitleNe,
    href: `${locale === 'en' ? '/en' : ''}/${item.articleCategory}/${item.articleSlug}`,
    readAt: item.readAt,
    firstReadAt: item.firstReadAt,
    scrollDepth: item.readPercent,
    completed: item.completed,
    sessions: item.sessions,
    dwellSeconds: item.dwellSeconds,
  }
}

function mergeHistory(device: ReadingHistoryRecord[], account: ReadingHistoryRecord[]) {
  const map = new Map<string, ReadingHistoryRecord>()
  for (const item of [...device, ...account]) {
    const identity = `${item.categorySlug}:${item.slug}`
    const previous = map.get(identity)
    map.set(identity, previous ? {
      ...previous,
      ...item,
      scrollDepth: Math.max(previous.scrollDepth, item.scrollDepth),
      dwellSeconds: Math.max(previous.dwellSeconds, item.dwellSeconds),
      sessions: Math.max(previous.sessions, item.sessions),
      completed: previous.completed || item.completed,
      firstReadAt: [previous.firstReadAt, item.firstReadAt].sort()[0]!,
      readAt: [previous.readAt, item.readAt].sort().at(-1)!,
    } : item)
  }
  return [...map.values()].sort((a, b) => b.readAt.localeCompare(a.readAt))
}

export function ReaderActivityPanel({ locale }: { locale: Locale }) {
  const [history, setHistory] = useState<ReadingHistoryRecord[]>([])
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [syncState, setSyncState] = useState<'loading' | 'synced' | 'device'>('loading')
  const [pending, startTransition] = useTransition()
  const english = locale === 'en'

  useEffect(() => {
    let cancelled = false
    const refreshLocal = () => {
      setHistory((current) => mergeHistory(
        safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY)),
        current,
      ))
      setBookmarks(safeParseArray<BookmarkRecord>(localStorage.getItem(READER_BOOKMARKS_KEY)))
    }
    refreshLocal()
    const fingerprint = getOrCreateReaderId()
    fetch(`/api/reading?fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`History request failed: ${response.status}`)
        return response.json() as Promise<{ history?: ApiHistory[] }>
      })
      .then((body) => {
        if (cancelled) return
        const local = safeParseArray<ReadingHistoryRecord>(localStorage.getItem(READER_HISTORY_KEY))
        const merged = mergeHistory(local, (body.history ?? []).map((item) => fromApi(item, locale)))
        setHistory(merged)
        localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(merged))
        setSyncState('synced')
      })
      .catch(() => {
        if (!cancelled) setSyncState('device')
      })
    window.addEventListener('nw-reader-state-change', refreshLocal)
    window.addEventListener('storage', refreshLocal)
    return () => {
      cancelled = true
      window.removeEventListener('nw-reader-state-change', refreshLocal)
      window.removeEventListener('storage', refreshLocal)
    }
  }, [locale])

  const completed = history.filter((item) => item.completed).length
  const recent = history.slice(0, 8)
  const totalMinutes = useMemo(
    () => Math.max(0, Math.round(history.reduce((sum, item) => sum + item.dwellSeconds, 0) / 60)),
    [history],
  )

  function clearHistory() {
    const fingerprint = getOrCreateReaderId()
    const previous = history
    setHistory([])
    localStorage.removeItem(READER_HISTORY_KEY)
    window.dispatchEvent(new Event('nw-reader-state-change'))
    startTransition(async () => {
      try {
        const response = await fetch(`/api/reading?fingerprint=${encodeURIComponent(fingerprint)}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Clear history failed: ${response.status}`)
        setSyncState('synced')
      } catch {
        setHistory(previous)
        localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(previous))
        setSyncState('device')
      }
    })
  }

  return (
    <section className="reader-ledger" lang={english ? 'en' : 'ne'}>
      <header className="reader-ledger__header">
        <div>
          <p className="editorial-kicker" lang="en">Reader record</p>
          <h2 className="reader-ledger__title">{english ? 'Your reading trail' : 'तपाईंको पढाइ यात्रा'}</h2>
          <p className="reader-ledger__dek">
            {english
              ? 'Continue where you stopped. Signed-in activity follows your account; device activity remains private to this browser until it syncs.'
              : 'जहाँ रोक्नुभएको थियो, त्यहीँबाट फेरि पढ्नुहोस्। खातामा जोडिएको इतिहास उपकरणहरूबीच सिङ्क हुन्छ।'}
          </p>
        </div>
        <span className="reader-ledger__sync" data-state={syncState} role="status">
          {syncState === 'loading'
            ? english ? 'Checking sync' : 'सिङ्क जाँचिँदै'
            : syncState === 'synced'
              ? english ? 'Account synced' : 'खातामा सिङ्क भयो'
              : english ? 'Device only' : 'यो उपकरणमा मात्र'}
        </span>
      </header>

      <dl className="reader-ledger__stats">
        <div><dt>{english ? 'Stories opened' : 'खोलिएका समाचार'}</dt><dd>{history.length}</dd></div>
        <div><dt>{english ? 'Finished' : 'पूरा पढिएका'}</dt><dd>{completed}</dd></div>
        <div><dt>{english ? 'Time reading' : 'पढाइ समय'}</dt><dd>{totalMinutes}<small>{english ? ' min' : ' मिनेट'}</small></dd></div>
        <div><dt>{english ? 'Saved' : 'सुरक्षित'}</dt><dd>{bookmarks.length}</dd></div>
      </dl>

      {recent.length ? (
        <ol className="reader-ledger__list">
          {recent.map((item, index) => (
            <li key={item.articleId}>
              <span className="reader-ledger__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <a href={item.href}>{item.title}</a>
                <p>{item.scrollDepth}% · {Math.max(1, Math.round(item.dwellSeconds / 60))} {english ? 'min' : 'मिनेट'} · {new Date(item.readAt).toLocaleString(english ? 'en-GB' : 'ne-NP')}</p>
              </div>
              <span className="reader-ledger__progress" aria-label={`${item.scrollDepth}%`}><i style={{ width: `${item.scrollDepth}%` }} /></span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="reader-ledger__empty">
          <strong>{english ? 'No reading history yet' : 'अहिलेसम्म पढाइ इतिहास छैन'}</strong>
          <p>{english ? 'Open a story and your progress will appear here after you allow personalization.' : 'व्यक्तिगत अनुभव अनुमति दिएपछि पढ्न थालेका समाचार यहाँ देखिन्छन्।'}</p>
        </div>
      )}

      {history.length ? (
        <button type="button" onClick={clearHistory} disabled={pending} className="text-action reader-ledger__clear">
          {pending ? (english ? 'Clearing…' : 'हटाइँदै…') : (english ? 'Clear reading history' : 'पढाइ इतिहास हटाउनुहोस्')}
        </button>
      ) : null}
    </section>
  )
}
