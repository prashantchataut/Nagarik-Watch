'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

const VOTE_KEY = 'nw-poll-votes'
const FINGERPRINT_KEY = 'nw-poll-fingerprint'

type PublicPoll = {
  id: string
  question: string
  options: string[]
  results: Record<string, number>
}

type VoteRecord = { pollId: string; optionId: string; at: string }
type VoteMap = Record<string, VoteRecord>

function readVotes(): VoteMap {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(VOTE_KEY) ?? '{}') as VoteMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistVote(record: VoteRecord): void {
  try {
    const votes = readVotes()
    window.localStorage.setItem(VOTE_KEY, JSON.stringify({ ...votes, [record.pollId]: record }))
  } catch {
    // Browser storage can be unavailable. The server-side uniqueness constraint still protects the vote.
  }
}

function fingerprint(): string {
  try {
    const existing = window.localStorage.getItem(FINGERPRINT_KEY)
    if (existing) return existing
    const value = window.crypto.randomUUID()
    window.localStorage.setItem(FINGERPRINT_KEY, value)
    return value
  } catch {
    return window.crypto.randomUUID()
  }
}

export function PollOfDay({
  locale,
  poll,
  className,
  headingId,
}: {
  locale: Locale
  poll: PublicPoll
  className?: string
  headingId?: string
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const instanceId = useId().replace(/:/g, '')
  const labelledBy = headingId ?? `poll-${poll.id}-label-${instanceId}`
  const questionId = `poll-${poll.id}-q-${instanceId}`
  const [myVote, setMyVote] = useState<VoteRecord | null>(null)
  const [results, setResults] = useState<Record<string, number>>(poll.results)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMyVote(readVotes()[poll.id] ?? null)
  }, [poll.id])

  const optionEntries = useMemo(
    () => poll.options.map((label, index) => ({ id: String(index), label })),
    [poll.options],
  )
  const totalVotes = Object.values(results).reduce((sum, count) => sum + count, 0)

  async function castVote(optionId: string) {
    if (myVote || submitting) return
    if (!hasLivePublicApi()) {
      setError(
        locale === 'en'
          ? 'Voting is not available on this static preview host.'
          : 'यो स्थिर पूर्वावलोकन होस्टमा मतदान उपलब्ध छैन।',
      )
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, optionId, fingerprint: fingerprint() }),
      })
      const body = (await response.json()) as {
        error?: string
        recorded?: boolean
        results?: Record<string, number>
      }
      if (!response.ok) throw new Error(body.error || 'Vote failed')
      const record = { pollId: poll.id, optionId, at: new Date().toISOString() }
      persistVote(record)
      setMyVote(record)
      if (body.results) setResults(body.results)
    } catch {
      setError(
        locale === 'en'
          ? 'Your vote could not be saved. Please try again.'
          : 'तपाईंको मत सुरक्षित हुन सकेन। फेरि प्रयास गर्नुहोस्।',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const heading = locale === 'en' ? 'Reader poll' : 'पाठक मतदान'

  return (
    <section className={className} aria-labelledby={questionId}>
      <div className="border border-rule bg-surface-raised px-4 py-4 sm:px-5 sm:py-5">
        <div>
          <p
            id={labelledBy}
            className="text-meta font-extrabold text-brand-strong"
            lang={lang}
          >
            {heading}
          </p>
          <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>

        <h2
          id={questionId}
          className="mt-3 font-display text-h3 font-bold leading-snug text-ink sm:text-h2"
          lang={lang}
        >
          {poll.question}
        </h2>

        <ul className="mt-4 grid gap-2">
          {optionEntries.map((option) => {
            const count = results[option.id] ?? 0
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const selected = myVote?.optionId === option.id
            const showResults = Boolean(myVote)
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => castVote(option.id)}
                  disabled={Boolean(myVote) || submitting}
                  aria-pressed={selected}
                  className="relative min-h-10 w-full overflow-hidden border border-rule bg-surface px-3 py-2 text-left transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99] disabled:cursor-default disabled:hover:border-rule disabled:hover:bg-surface"
                >
                  {showResults ? (
                    <span
                      className="absolute inset-y-0 left-0 bg-brand-tint"
                      style={{ width: `${percentage}%` }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative flex items-center justify-between gap-3">
                    <span className="text-meta font-semibold leading-snug text-ink sm:text-body" lang={lang}>
                      {selected ? '✓ ' : ''}
                      {option.label}
                    </span>
                    {showResults ? (
                      <span className="shrink-0 text-meta font-bold tabular-nums text-ink-soft">
                        {percentage}%
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-3 border-t border-rule pt-3 text-caption text-ink-soft" aria-live="polite" lang={lang}>
          {error ||
            (myVote
              ? locale === 'en'
                ? `Vote recorded. ${totalVotes} total votes.`
                : `मत सुरक्षित भयो। जम्मा ${totalVotes} मत।`
              : locale === 'en'
                ? 'Choose one option. One vote per reader.'
                : 'एउटा विकल्प छान्नुहोस्। प्रत्येक पाठकलाई एक मत।')}
        </p>
      </div>
    </section>
  )
}
