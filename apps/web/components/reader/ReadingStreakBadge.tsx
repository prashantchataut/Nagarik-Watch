'use client'

import { useEffect, useState } from 'react'
import { computeStreak, streakRisk, type StreakSummary } from '@/lib/reader/streaks'
import type { ReadingHistoryRecord } from '@/lib/reader/state'

export function ReadingStreakBadge({
  locale,
  history,
}: {
  locale: 'ne' | 'en'
  history: ReadingHistoryRecord[]
}) {
  const [summary, setSummary] = useState<StreakSummary | null>(null)
  const [riskHours, setRiskHours] = useState(0)

  useEffect(() => {
    const next = computeStreak(history)
    setSummary(next)
    setRiskHours(streakRisk(next).hoursRemaining)
  }, [history])

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
