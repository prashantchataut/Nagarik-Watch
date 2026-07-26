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
import { ArticleToolsMenu } from '@/components/article/ArticleToolsMenu'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

type ReaderArticleControlsProps = {
  story: StoryCardData
  locale: Locale
  title: string
  href: string
  shareUrl: string
  articleSlug: string
  articleCategory: string
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
  shareUrl,
  articleSlug,
  articleCategory,
  readingMinutes,
  premiumReader = false,
  membershipPublic = false,
}: ReaderArticleControlsProps) {
  const [readingMode, setReadingMode] = useState(false)
  const [scrollDepth, setScrollDepth] = useState(0)
  const [personalized, setPersonalized] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechHint, setSpeechHint] = useState<string | null>(null)
  const [historySyncFailed, setHistorySyncFailed] = useState(false)
  const [meter, setMeter] = useState<{ count: number; limit: number } | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [readingSessionId] = useState(() =>
    globalThis.crypto?.randomUUID?.() ?? `read-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  )
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    setSpeechSupported(supported)
    if (!supported) {
      setSpeechHint(
        english
          ? 'Listen is not available in this browser.'
          : 'यो ब्राउजरमा सुन्ने सुविधा उपलब्ध छैन।',
      )
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [english])

  useEffect(() => {
    document.documentElement.classList.toggle('reader-focus-mode', readingMode)
    document.body?.classList.toggle('reader-focus-mode', readingMode)
    return () => {
      document.documentElement.classList.remove('reader-focus-mode')
      document.body?.classList.remove('reader-focus-mode')
    }
  }, [readingMode])

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
      if (!hasLivePublicApi()) return
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

  const remaining = useMemo(
    () => remainingReadingMinutes(readingMinutes, scrollDepth),
    [readingMinutes, scrollDepth],
  )

  function pickVoice(voices: SpeechSynthesisVoice[], preferNe: boolean): SpeechSynthesisVoice | null {
    if (!voices.length) return null
    const ranked = preferNe
      ? [
          (v: SpeechSynthesisVoice) => /^ne\b/i.test(v.lang),
          (v: SpeechSynthesisVoice) => /nepali/i.test(v.name),
          (v: SpeechSynthesisVoice) => /^hi\b/i.test(v.lang),
          (v: SpeechSynthesisVoice) => /hindi|devanagari|indic/i.test(`${v.name} ${v.lang}`),
        ]
      : [
          (v: SpeechSynthesisVoice) => /^en-US\b/i.test(v.lang),
          (v: SpeechSynthesisVoice) => /^en\b/i.test(v.lang),
        ]
    for (const match of ranked) {
      const found = voices.find(match)
      if (found) return found
    }
    return voices[0] ?? null
  }

  function toggleNarrator() {
    if (!speechSupported) return
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const bodies = Array.from(document.querySelectorAll('[data-narrator-body="true"]'))
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)
    const text = [title, ...bodies].filter(Boolean).join('. ').replace(/\s+/g, ' ').trim()
    if (!text) {
      setSpeechHint(
        english
          ? 'No article text was found to read aloud.'
          : 'सुनाउन मिल्ने लेख पाठ भेटिएन।',
      )
      return
    }

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 12000))
    const preferNe = !english
    utterance.lang = preferNe ? 'ne-NP' : 'en-US'
    utterance.rate = preferNe ? 0.88 : 0.95

    function startWithVoices(voices: SpeechSynthesisVoice[]) {
      const voice = pickVoice(voices, preferNe)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang || utterance.lang
        if (preferNe && !/^ne\b/i.test(voice.lang) && !/nepali/i.test(voice.name)) {
          setSpeechHint(
            english
              ? 'Nepali system voice not found; using the closest available voice.'
              : 'नेपाली सिस्टम आवाज भेटिएन; नजिकको उपलब्ध आवाज प्रयोग हुँदैछ।',
          )
        } else {
          setSpeechHint(null)
        }
      } else if (preferNe) {
        setSpeechHint(
          'नेपाली आवाज यस उपकरणमा छैन। ब्राउजर/OS मा भाषा प्याक थप्नुहोस्।',
        )
      }
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => {
        setSpeaking(false)
        setSpeechHint(
          english
            ? 'Audio playback failed in this browser.'
            : 'यो ब्राउजरमा आवाज बजाउन सकिएन।',
        )
      }
      setSpeaking(true)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }

    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      startWithVoices(existing)
      return
    }
    // Chrome loads voices asynchronously.
    const onVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      startWithVoices(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      startWithVoices(window.speechSynthesis.getVoices())
    }, 400)
  }

  return (
    <div className="article-utility-bar" lang={lang} aria-label={locale === 'en' ? 'Article reading tools' : 'समाचार पढाइ उपकरण'}>
      <ExperimentExposure experimentId={ARTICLE_COMPLETION_EXPERIMENT_ID} />
      <ArticleToolsMenu
        story={story}
        locale={locale}
        title={title}
        shareUrl={shareUrl}
        articleSlug={articleSlug}
        articleCategory={articleCategory}
        readingMode={readingMode}
        onReadingModeChange={setReadingMode}
        speechSupported={speechSupported}
        speaking={speaking}
        speechHint={speechHint}
        onToggleNarrator={toggleNarrator}
      />
      <div className="article-utility-bar__status" aria-live="polite">
        <span>
          <strong>{remaining}</strong> {locale === 'en' ? 'min left' : 'मिनेट बाँकी'}
        </span>
        {meter ? (
          <span>
            {locale === 'en'
              ? `Free reads this session: ${meter.count}/${meter.limit}`
              : `यो सत्रका निःशुल्क पढाइ: ${meter.count}/${meter.limit}`}
          </span>
        ) : null}
        {historySyncFailed ? (
          <span data-warning="true">
            {locale === 'en' ? 'Device-only history' : 'इतिहास उपकरणमा मात्र'}
          </span>
        ) : null}
        {!personalized ? <span>{locale === 'en' ? 'History off' : 'इतिहास बन्द'}</span> : null}
      </div>
      {showFeedback ? (
        <div className="article-feedback" role="group" aria-label={locale === 'en' ? 'Article feedback' : 'समाचार प्रतिक्रिया'}>
          <span>{locale === 'en' ? 'Was this report useful?' : 'यो समाचार उपयोगी भयो?'}</span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('nw:reader-feedback:last-answer', 'useful')
              setShowFeedback(false)
            }}
          >
            {locale === 'en' ? 'Yes' : 'भयो'}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('nw:reader-feedback:last-answer', 'not-useful')
              setShowFeedback(false)
            }}
          >
            {locale === 'en' ? 'Not really' : 'खासै भएन'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
