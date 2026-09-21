'use client'

import { useMemo } from 'react'
import { computeStreak, streakRisk, type StreakSummary } from '@/lib/reader/streaks'
import type { ReadingHistoryRecord } from '@/lib/reader/state'
import { useHydrated } from '@/lib/browser/use-client-state'

export function ReadingStreakBadge({
  locale,
  history,
}: {
  locale: 'ne' | 'en'
  history: ReadingHistoryRecord[]
}) {
  // `computeStreak` and `streakRisk` both key off the reader's local calendar
  // day, which the server does not know — stay blank until hydration rather
  // than prerendering a streak computed in UTC.
  const hydrated = useHydrated()
  const summary = useMemo<StreakSummary | null>(
    () => (hydrated ? computeStreak(history) : null),
    [hydrated, history],
  )
  const riskHours = summary ? streakRisk(summary).hoursRemaining : 0

  if (!summary || summary.current <= 0) return null

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
