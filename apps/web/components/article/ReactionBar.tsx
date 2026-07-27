'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/engagement/reactions-client'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

function reactionVisitorKey(): string {
  if (typeof window === 'undefined') return ''
  const key = 'nw_fp'
  let fp = window.localStorage.getItem(key)
  if (!fp) {
    fp =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(key, fp)
  }
  return fp
}

export function ReactionBar({
  locale,
  articleSlug,
  articleCategory,
}: {
  locale: Locale
  articleSlug: string
  articleCategory: string
}) {
  const en = locale === 'en'
  const [counts, setCounts] = useState<Record<ReactionEmoji, number>>(
    Object.fromEntries(REACTION_EMOJIS.map((emoji) => [emoji, 0])) as Record<ReactionEmoji, number>,
  )
  const [active, setActive] = useState<Partial<Record<ReactionEmoji, boolean>>>({})
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!hasLivePublicApi()) return
    let cancelled = false
    fetch(`/api/reactions?articleSlug=${encodeURIComponent(articleSlug)}`, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { counts?: Record<ReactionEmoji, number> } | null) => {
        if (!cancelled && data?.counts) setCounts(data.counts)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [articleSlug])

  function toggle(emoji: ReactionEmoji) {
    if (!hasLivePublicApi()) return
    const previous = counts
    const wasActive = Boolean(active[emoji])
    setCounts((current) => ({
      ...current,
      [emoji]: Math.max(0, current[emoji] + (wasActive ? -1 : 1)),
    }))
    setActive((current) => ({ ...current, [emoji]: !wasActive }))
    startTransition(async () => {
      try {
        const response = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            articleSlug,
            articleCategory,
            emoji,
            visitorKey: reactionVisitorKey(),
          }),
        })
        const data = (await response.json()) as {
          counts?: Record<ReactionEmoji, number>
          active?: boolean
        }
        if (!response.ok || !data.counts) {
          setCounts(previous)
          setActive((current) => ({ ...current, [emoji]: wasActive }))
          return
        }
        setCounts(data.counts)
        setActive((current) => ({ ...current, [emoji]: Boolean(data.active) }))
      } catch {
        setCounts(previous)
        setActive((current) => ({ ...current, [emoji]: wasActive }))
      }
    })
  }

  return (
    <section
      className="mt-8 border-t border-rule pt-5 print:hidden"
      aria-label={en ? 'Article reactions' : 'समाचार प्रतिक्रिया'}
      lang={en ? 'en' : 'ne'}
    >
      <p className="text-meta font-bold text-ink-soft">
        {en ? 'Your reaction' : 'तपाईंको प्रतिक्रिया'}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {REACTION_EMOJIS.map((emoji) => (
          <li key={emoji}>
            <button
              type="button"
              disabled={pending}
              aria-pressed={Boolean(active[emoji])}
              className={`inline-flex min-h-11 items-center gap-2 border px-3 text-meta font-bold transition-colors ${
                active[emoji]
                  ? 'border-brand bg-brand-tint text-brand-strong'
                  : 'border-rule bg-surface text-ink-soft hover:border-brand hover:text-brand-strong'
              }`}
              onClick={() => toggle(emoji)}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{counts[emoji]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
