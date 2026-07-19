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
import {
  ARTICLE_COMPLETION_EXPERIMENT_ID,
  ExperimentExposure,
  trackExperimentConversion,
} from '@/components/experiments/ExperimentExposure'
import { rafThrottle } from '@/lib/browser/raf-throttle'
import { addArticleToSessionMeter, FREE_ARTICLE_METER_KEY } from '@/lib/free-article-meter'
import { canShowWeeklyFeedback } from '@/lib/reader/retention'

type ReaderArticleControlsProps = {
  story: StoryCardData
  locale: Locale
  title: string
  href: string
  readingMinutes: number
  premiumReader?: boolean
  /** When false (Option A default), skip free-reads meter UI entirely. */
  membershipPublic?: boolean
}

export function ReaderArticleControls({
  story,
  locale,
  title,
  href,
  readingMinutes,
  premiumReader = false,
  membershipPublic = false,
}: ReaderArticleControlsProps) {
  const [readingMode, setReadingMode] = useState(false)
  const [scrollDepth, setScrollDepth] = useState(0)
  const [personalized, setPersonalized] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [historySyncFailed, setHistorySyncFailed] = useState(false)
  const [meter, setMeter] = useState<{ count: number; limit: number } | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
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
    if (!membershipPublic || premiumReader) return
    const next = addArticleToSessionMeter(
      sessionStorage.getItem(FREE_ARTICLE_METER_KEY),
      `${story.category.slug}:${story.slug}`,
    )
    sessionStorage.setItem(FREE_ARTICLE_METER_KEY, JSON.stringify(next.articles))
    setMeter({ count: next.count, limit: next.limit })
  }, [membershipPublic, premiumReader, story.category.slug, story.slug])

  useEffect(() => {
    if (scrollDepth < 92) return
    const key = 'nw:reader-feedback:last-shown'
    if (!canShowWeeklyFeedback(localStorage.getItem(key))) return
    localStorage.setItem(key, new Date().toISOString())
    setShowFeedback(true)
  }, [scrollDepth])

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
    let restored = false

    function currentDepth() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return 100
      return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100))
    }

    function restorePosition() {
      if (restored || !hasPersonalizationConsent()) return
      const previous = safeParseArray<ReadingHistoryRecord>(
        localStorage.getItem(READER_HISTORY_KEY),
      )
      const prior = previous.find((item) => item.articleId === story.id || item.slug === story.slug)
      if (!prior || prior.completed || !prior.scrollDepth || prior.scrollDepth < 8) return
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const target = Math.round((prior.scrollDepth / 100) * scrollable)
      if (target < 120) return
      restored = true
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: target, behavior: 'auto' })
        maxDepth = Math.max(maxDepth, prior.scrollDepth)
        setScrollDepth(maxDepth)
      })
    }

    function record() {
      maxDepth = Math.max(maxDepth, currentDepth())
      setScrollDepth(maxDepth)
    }

    const recordThrottled = rafThrottle(record)

    function persist() {
      recordThrottled.flush()
      record()
      if (!hasPersonalizationConsent()) return
      const previous = safeParseArray<ReadingHistoryRecord>(
        localStorage.getItem(READER_HISTORY_KEY),
      )
      const readPercent = Math.round(maxDepth)
      const completed = maxDepth >= 92
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
        completed,
        readingMinutes,
        dwellSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        sessionId: readingSessionId,
      })
      localStorage.setItem(READER_HISTORY_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('nw-reader-state-change'))
      if (completed) trackExperimentConversion(ARTICLE_COMPLETION_EXPERIMENT_ID)
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
          completed,
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
    restorePosition()
    window.addEventListener('scroll', recordThrottled, { passive: true })
    window.addEventListener('pagehide', persist)
    const interval = window.setInterval(persist, 15_000)
    return () => {
      persist()
      window.removeEventListener('scroll', recordThrottled)
      window.removeEventListener('pagehide', persist)
      window.clearInterval(interval)
      recordThrottled.cancel()
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
      <ExperimentExposure experimentId={ARTICLE_COMPLETION_EXPERIMENT_ID} />
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
        {meter ? <span>{locale === 'en' ? `Free reads this session: ${meter.count}/${meter.limit}` : `यो सत्रका निःशुल्क पढाइ: ${meter.count}/${meter.limit}`}</span> : null}
        {historySyncFailed ? <span data-warning="true">{locale === 'en' ? 'Device-only history' : 'इतिहास उपकरणमा मात्र'}</span> : null}
        {!personalized ? <span>{locale === 'en' ? 'History off' : 'इतिहास बन्द'}</span> : null}
      </div>
      {showFeedback ? (
        <div className="article-feedback" role="group" aria-label={locale === 'en' ? 'Article feedback' : 'समाचार प्रतिक्रिया'}>
          <span>{locale === 'en' ? 'Was this report useful?' : 'यो समाचार उपयोगी भयो?'}</span>
          <button type="button" onClick={() => {
            localStorage.setItem('nw:reader-feedback:last-answer', 'useful')
            setShowFeedback(false)
          }}>{locale === 'en' ? 'Yes' : 'भयो'}</button>
          <button type="button" onClick={() => {
            localStorage.setItem('nw:reader-feedback:last-answer', 'not-useful')
            setShowFeedback(false)
          }}>{locale === 'en' ? 'Not really' : 'खासै भएन'}</button>
        </div>
      ) : null}
    </div>
  )
}
