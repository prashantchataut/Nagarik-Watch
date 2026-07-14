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
import { CONSENT_EVENT, getOrCreateReaderId, hasPersonalizationConsent } from '@/lib/reader/consent'

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
  const [personalized, setPersonalized] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [historySyncFailed, setHistorySyncFailed] = useState(false)
  const [readingSessionId] = useState(() =>
    globalThis.crypto?.randomUUID?.() ?? `read-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        'SpeechSynthesisUtterance' in window,
    )
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    function refreshConsent() {
      setPersonalized(hasPersonalizationConsent())
    }
    refreshConsent()
    window.addEventListener(CONSENT_EVENT, refreshConsent)
    return () => window.removeEventListener(CONSENT_EVENT, refreshConsent)
  }, [])

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
      if (!hasPersonalizationConsent()) return
      const previous = safeParseArray<ReadingHistoryRecord>(
        localStorage.getItem(READER_HISTORY_KEY),
      )
      const readPercent = Math.round(maxDepth)
      const next = upsertHistory(previous, {
        articleId: story.id,
        slug: story.slug,
        categorySlug: story.category.slug,
        tagSlugs: story.tags?.map((tag) => tag.slug) ?? [],
        authorSlugs: story.authors.map((author) => author.slug),
        title,
        href,
        readAt: new Date().toISOString(),
        scrollDepth: readPercent,
        completed: maxDepth >= 92,
        readingMinutes,
        dwellSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        sessionId: readingSessionId,
      })
      localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('nw-reader-state-change'))
      void fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fingerprint: getOrCreateReaderId(),
          articleSlug: story.slug,
          articleCategory: story.category.slug,
          articleTitleNe: story.titleNe,
          readPercent,
          dwellSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
          completed: maxDepth >= 92,
          sessionId: readingSessionId,
        }),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Reading sync failed: ${response.status}`)
          setHistorySyncFailed(false)
        })
        .catch(() => setHistorySyncFailed(true))
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
  }, [href, readingMinutes, story.category.slug, story.id, story.slug, story.titleNe, title, readingSessionId])

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

  function toggleNarrator() {
    if (!speechSupported) return
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const body = document.querySelector('[data-narrator-body="true"]')?.textContent?.trim() ?? ''
    const text = [title, body].filter(Boolean).join('. ')
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 8000))
    utterance.lang = locale === 'en' ? 'en-US' : 'ne-NP'
    utterance.rate = 0.92
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="article-utility-bar" lang={lang} aria-label={locale === 'en' ? 'Article reading tools' : 'समाचार पढाइ उपकरण'}>
      <div className="article-utility-bar__actions">
        <button type="button" onClick={() => setReadingMode((value) => !value)} aria-pressed={readingMode}>
          <span>{modeLabel}</span>
        </button>
        <button type="button" onClick={toggleNarrator} disabled={!speechSupported} aria-pressed={speaking}>
          <span>{speaking ? (locale === 'en' ? 'Stop audio' : 'आवाज रोक्नुहोस्') : (locale === 'en' ? 'Listen' : 'सुन्नुहोस्')}</span>
        </button>
      </div>
      <div className="article-utility-bar__status" aria-live="polite">
        <span><strong>{remaining}</strong> {locale === 'en' ? 'min left' : 'मिनेट बाँकी'}</span>
        {historySyncFailed ? <span data-warning="true">{locale === 'en' ? 'Device-only history' : 'इतिहास उपकरणमा मात्र'}</span> : null}
        {!personalized ? <span>{locale === 'en' ? 'History off' : 'इतिहास बन्द'}</span> : null}
      </div>
    </div>
  )
}
