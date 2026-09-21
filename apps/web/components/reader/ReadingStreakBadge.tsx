'use client'

import { computeStreak, streakRisk } from '@/lib/reader/streaks'
import type { ReadingHistoryRecord } from '@/lib/reader/state'
import { useHydrated } from '@/lib/browser/use-browser-store'

export function ReadingStreakBadge({
  locale,
  history,
}: {
  locale: 'ne' | 'en'
  history: ReadingHistoryRecord[]
}) {
  // The streak is computed against "now" and the reader's local midnight, so it
  // is a client-only value: render nothing until hydration instead of computing
  // it in an effect and forcing a second render.
  const hydrated = useHydrated()
  if (!hydrated) return null

  const summary = computeStreak(history)
  if (summary.current <= 0) return null
  const riskHours = streakRisk(summary).hoursRemaining

  const english = locale === 'en'
  return (
    <p className="rounded-md border border-brand/30 bg-brand-tint/40 px-3 py-2 text-meta text-ink-soft">
      <strong className="text-ink">
        {english ? `${summary.current}-day reading streak` : `${summary.current}-दिन पढाइ स्ट्रिक`}
      </strong>
      {riskHours > 0 ? (
        <span>
          {' '}
          ·{' '}
          {english
            ? `${riskHours}h left to keep it today`
            : `आज कायम राख्न ${riskHours} घण्टा बाँकी`}
        </span>
      ) : null}
    </p>
  )
}
