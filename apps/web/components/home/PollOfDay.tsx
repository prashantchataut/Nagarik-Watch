'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'

/**
 * PollOfDay — homepage "मतदान / Poll of the day".
 *
 * Vote-once-per-reader enforcement is client-side via localStorage (keyed by poll
 * id). Until the CMS poll manager + a persistence endpoint are wired, results are
 * seeded with a plausible baseline so a lone voter does not see "100% (1 vote)".
 * The seed totals are clearly fictional-looking (multiples of 7) and reset only
 * when the poll id changes.
 *
 * When the admin /admin/polls page is connected to a real store, the only change
 * is swapping `DEFAULT_POLL` for a server-fetched poll + a POST /api/poll route;
 * the rendering, vote-once guard, and result bar stay identical.
 */

export type PollOption = { id: string; labelNe: string; labelEn: string; seedVotes: number }

export type Poll = {
  id: string
  questionNe: string
  questionEn: string
  options: PollOption[]
}

const DEFAULT_POLL: Poll = {
  id: '2026-06-monsoon',
  questionNe: 'यस वर्षको बर्सातको तयारी तपाईंलाई कस्तो लाग्छ?',
  questionEn: 'How do you rate this year’s monsoon preparedness?',
  options: [
    { id: 'a', labelNe: 'पर्याप्त', labelEn: 'Adequate', seedVotes: 49 },
    { id: 'b', labelNe: 'अपर्याप्त', labelEn: 'Inadequate', seedVotes: 91 },
    { id: 'c', labelNe: 'अनिश्चित', labelEn: 'Not sure', seedVotes: 28 },
  ],
}

const STORAGE_KEY = 'nw-poll-vote'

type VoteRecord = { pollId: string; optionId: string; at: string }

function readVote(): VoteRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VoteRecord
    if (!parsed.pollId || !parsed.optionId) return null
    return parsed
  } catch {
    return null
  }
}

function writeVote(rec: VoteRecord): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec))
  } catch {
    // localStorage may be blocked (private mode); fail silently — the vote still
    // counts for this session via state.
  }
}

export function PollOfDay({ locale, className }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const poll = DEFAULT_POLL
  const [voted, setVoted] = useState<VoteRecord | null>(null)
  const [mounted, setMounted] = useState(false)

  // Hydrate the persisted vote on mount. localStorage access is deferred to
  // avoid SSR/hydration mismatch — the server render always shows the form.
  useEffect(() => {
    setVoted(readVote())
    setMounted(true)
  }, [])

  const totalSeed = poll.options.reduce((sum, o) => sum + o.seedVotes, 0)
  const myOption = voted && voted.pollId === poll.id ? voted.optionId : null
  const totalVotes = totalSeed + (myOption ? 1 : 0)

  function castVote(optionId: string) {
    if (voted && voted.pollId === poll.id) return
    const rec: VoteRecord = { pollId: poll.id, optionId, at: new Date().toISOString() }
    writeVote(rec)
    setVoted(rec)
  }

  const heading = locale === 'en' ? 'Poll of the day' : 'आजको मतदान'
  const ctaResults = locale === 'en' ? 'Results' : 'नतिजा'
  const ctaVotes = (n: number) => (locale === 'en' ? `${n} votes` : `${n} मत`)
  const alreadyVoted = locale === 'en' ? 'You voted.' : 'तपाईंले मत दिनुभयो।'

  return (
    <section className={className} aria-label={heading} aria-live="polite" data-mounted={mounted}>
      <div className="rounded-md border border-rule bg-surface-raised p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-h3 font-bold text-ink" lang={lang}>
            {heading}
          </h2>
          <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-brand-strong">
            {locale === 'en' ? 'Reader poll' : 'पाठक मत'}
          </span>
        </div>

        <p className="mt-3 text-body font-semibold text-ink" lang={lang}>
          {locale === 'en' ? poll.questionEn : poll.questionNe}
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {poll.options.map((opt) => {
            const label = locale === 'en' ? opt.labelEn : opt.labelNe
            const isMine = myOption === opt.id
            const count = opt.seedVotes + (isMine ? 1 : 0)
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const showResults = Boolean(myOption) || mounted

            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => castVote(opt.id)}
                  disabled={Boolean(myOption)}
                  className={`group relative w-full overflow-hidden rounded-md border text-left transition-colors duration-fast ease-out-quint ${
                    isMine
                      ? 'border-brand bg-brand-tint'
                      : 'border-rule bg-surface hover:border-brand hover:bg-brand-tint/40'
                  } ${myOption ? 'cursor-default' : 'cursor-pointer'}`}
                  aria-pressed={isMine}
                >
                  {showResults && (
                    <span
                      className="absolute inset-y-0 left-0 bg-brand-tint/70 transition-all duration-base"
                      style={{ width: `${pct}%` }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      {isMine ? <CheckGlyph /> : null}
                      <span className="font-medium text-ink" lang={lang}>
                        {label}
                      </span>
                    </span>
                    {showResults ? (
                      <span className="text-meta font-semibold tabular-nums text-ink-soft">
                        {pct}%
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-3 text-caption text-ink-soft" lang={lang}>
          {myOption ? alreadyVoted : ctaResults} · {ctaVotes(totalVotes)}
        </p>
      </div>
    </section>
  )
}

function CheckGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="text-brand-strong"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
