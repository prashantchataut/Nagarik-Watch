'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import {
  READER_BOOKMARKS_KEY,
  READER_HISTORY_KEY,
  safeParseArray,
  type BookmarkRecord,
  type ReadingHistoryRecord,
} from '@/lib/reader/state'
import { getOrCreateReaderId } from '@/lib/reader/consent'
import { completedReadingDays, currentReadingStreak } from '@/lib/reader/retention'
import { computeStreak, streakRisk } from '@/lib/reader/streaks'
import { loyaltyFromLifetimeReads } from '@/lib/reader/loyalty'
import { continueReadingForReader } from '@/lib/reader/personalize'

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

export function ReaderActivityPanel({ locale, catalog = [] }: { locale: Locale; catalog?: StoryCardData[] }) {
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
  const readingDays = useMemo(() => completedReadingDays(history), [history])
  const streak = useMemo(() => currentReadingStreak(readingDays), [readingDays])
  const streakSummary = useMemo(() => computeStreak(history), [history])
  const risk = useMemo(() => streakRisk(streakSummary), [streakSummary])
  const unfinished = useMemo(
    () => (catalog.length ? continueReadingForReader(catalog, history) : null),
    [catalog, history],
  )
  const loyalty = useMemo(() => loyaltyFromLifetimeReads(completed), [completed])

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

      {unfinished ? (
        <a
          href={`${english ? '/en' : ''}/${unfinished.category.slug}/${unfinished.slug}`}
          className="reader-ledger__continue"
          lang={english ? 'en' : 'ne'}
        >
          <span>{english ? 'Continue reading' : 'पढाइ जारी राखौं'}</span>
          <strong>{english && unfinished.titleEn ? unfinished.titleEn : unfinished.titleNe}</strong>
        </a>
      ) : null}

      {streakSummary.current > 0 ? (
        <div className="reader-ledger__streak-badge" role="status" data-at-risk={risk.atRisk}>
          <strong>
            {english
              ? `${streakSummary.current}-day reading streak`
              : `${streakSummary.current} दिनको लगातार पढाइ`}
          </strong>
          <span>
            {risk.atRisk
              ? english
                ? `Read one story in the next ${Math.ceil(risk.hoursRemaining)}h to keep it going.`
                : `यो लगातार पढाइ जोगाउन आउँदो ${Math.ceil(risk.hoursRemaining)} घण्टाभित्र एक समाचार पढ्नुहोस्।`
              : english
                ? `Longest run so far: ${streakSummary.longest} day${streakSummary.longest === 1 ? '' : 's'}.`
                : `अहिलेसम्मको सबैभन्दा लामो लगातार पढाइ: ${streakSummary.longest} दिन।`}
          </span>
        </div>
      ) : null}

      <dl className="reader-ledger__stats">
        <div><dt>{english ? 'Stories opened' : 'खोलिएका समाचार'}</dt><dd>{history.length}</dd></div>
        <div><dt>{english ? 'Finished' : 'पूरा पढिएका'}</dt><dd>{completed}</dd></div>
        <div><dt>{english ? 'Time reading' : 'पढाइ समय'}</dt><dd>{totalMinutes}<small>{english ? ' min' : ' मिनेट'}</small></dd></div>
        <div><dt>{english ? 'Saved' : 'सुरक्षित'}</dt><dd>{bookmarks.length}</dd></div>
        <div>
          <dt>{english ? 'Loyalty' : 'निष्ठा'}</dt>
          <dd data-loyalty-tier={loyalty.tier}>
            {loyalty.tier}
            {loyalty.readsToNextTier != null ? (
              <small>
                {english
                  ? ` · ${loyalty.readsToNextTier} to ${loyalty.nextTier}`
                  : ` · ${loyalty.nextTier} सम्म ${loyalty.readsToNextTier}`}
              </small>
            ) : null}
          </dd>
        </div>
      </dl>
      <div className="reader-ledger__calendar" aria-label={english ? 'Completed reading days' : 'पूरा पढाइ भएका दिन'}>
        <div>
          <strong>{english ? 'Recent reading days' : 'हालका पढाइ दिन'}</strong>
          <span>
            {streak > 0
              ? english ? `${streak} consecutive day${streak === 1 ? '' : 's'}` : `${streak} दिन लगातार`
              : english ? 'No current run — read whenever it suits you' : 'हाल निरन्तरता छैन — आफूलाई मिल्दा पढ्नुहोस्'}
          </span>
        </div>
        <ol>
          {readingDays.map((day) => (
            <li key={day.date} data-read={day.completed > 0} title={`${day.date}: ${day.completed}`}>
              <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString(english ? 'en-GB' : 'ne-NP', { weekday: 'narrow' })}</span>
              <i aria-hidden="true" />
            </li>
          ))}
        </ol>
      </div>

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
