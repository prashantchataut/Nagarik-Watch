/**
 * Byline and desk concentration over a recent window.
 *
 * A civic newsroom's failure mode is not usually a wrong story, it is a narrow
 * one: four reporters filing most of the output, or one desk absorbing the
 * front page while three others go quiet for a fortnight. Both are visible in
 * the published record and invisible to everyone working inside it.
 *
 * Concentration is measured with the Herfindahl index — the sum of squared
 * shares, 1/n when the output is evenly spread and 1 when a single byline
 * holds everything. It is the standard measure for exactly this question and
 * it needs no tuning, which matters for a number an editor is meant to trust.
 */
import type { StoryCardData } from '@nagarikwatch/db'

export type BalanceShare = {
  key: string
  label: string
  stories: number
  share: number
}

export type BylineBalance = {
  stories: number
  authors: BalanceShare[]
  desks: BalanceShare[]
  /** Herfindahl index over bylines, 0..1. Higher means more concentrated. */
  authorConcentration: number
  /** Herfindahl index over desks, 0..1. */
  deskConcentration: number
  /** Desks that published nothing in the window, from the supplied list. */
  silentDesks: string[]
  findings: BalanceFinding[]
}

export type BalanceFinding = {
  code: 'byline-dominance' | 'byline-concentration' | 'desk-dominance' | 'desk-silent'
  severity: 'warn' | 'info'
  detail: string
}

/** One byline above this share of the window is a dependency, not a beat. */
const BYLINE_DOMINANCE = 0.35
/**
 * Herfindahl above this reads as "a few people are the newsroom". 1/0.3 is an
 * effective byline count of 3.3 — an even split across four reporters scores
 * 0.25 and must stay quiet, an even split across three scores 0.33 and should
 * not.
 */
const BYLINE_CONCENTRATION = 0.3
/** One desk above this share of output means the rest are not being covered. */
const DESK_DOMINANCE = 0.45

function tally(entries: Array<{ key: string; label: string }>): BalanceShare[] {
  const counts = new Map<string, BalanceShare>()
  for (const entry of entries) {
    const existing = counts.get(entry.key)
    if (existing) existing.stories += 1
    else counts.set(entry.key, { key: entry.key, label: entry.label, stories: 1, share: 0 })
  }
  const total = entries.length || 1
  const shares = [...counts.values()]
  for (const share of shares) share.share = share.stories / total
  return shares.sort((a, b) => b.stories - a.stories || a.label.localeCompare(b.label))
}

function herfindahl(shares: BalanceShare[]): number {
  return shares.reduce((total, share) => total + share.share * share.share, 0)
}

/**
 * @param stories the published window, newest first or not — order is ignored
 * @param knownDesks every desk that is supposed to be filing, so silence is
 *        reportable. Without it a desk that published nothing is invisible.
 */
export function bylineBalance(
  stories: readonly StoryCardData[],
  knownDesks: ReadonlyArray<{ slug: string; nameNe: string }> = [],
): BylineBalance {
  // A story with three bylines counts once for each of them: shared credit is
  // what the byline says, and dropping the co-authors would understate exactly
  // the reporters who are least likely to hold a solo front page.
  const authorEntries = stories.flatMap((story) =>
    (story.authors ?? []).map((author) => ({ key: author.slug, label: author.name })),
  )
  const deskEntries = stories.map((story) => ({
    key: story.category.slug,
    label: story.category.nameNe || story.category.slug,
  }))

  const authors = tally(authorEntries)
  const desks = tally(deskEntries)
  const authorConcentration = herfindahl(authors)
  const deskConcentration = herfindahl(desks)

  const published = new Set(desks.map((desk) => desk.key))
  const silentDesks = knownDesks
    .filter((desk) => !published.has(desk.slug))
    .map((desk) => desk.nameNe || desk.slug)

  const findings: BalanceFinding[] = []
  const topAuthor = authors[0]
  if (topAuthor && topAuthor.share >= BYLINE_DOMINANCE && stories.length >= 10) {
    findings.push({
      code: 'byline-dominance',
      severity: 'warn',
      detail: `${topAuthor.label} carries ${Math.round(topAuthor.share * 100)}% of the window (${topAuthor.stories}/${stories.length}).`,
    })
  }
  if (authorConcentration >= BYLINE_CONCENTRATION && stories.length >= 10) {
    findings.push({
      code: 'byline-concentration',
      severity: 'info',
      detail: `Byline concentration ${authorConcentration.toFixed(2)} across ${authors.length} reporters.`,
    })
  }
  const topDesk = desks[0]
  if (topDesk && topDesk.share >= DESK_DOMINANCE && stories.length >= 10) {
    findings.push({
      code: 'desk-dominance',
      severity: 'warn',
      detail: `${topDesk.label} holds ${Math.round(topDesk.share * 100)}% of published output.`,
    })
  }
  if (silentDesks.length > 0) {
    findings.push({
      code: 'desk-silent',
      severity: 'warn',
      detail: `No stories in this window from: ${silentDesks.join(', ')}.`,
    })
  }

  return {
    stories: stories.length,
    authors,
    desks,
    authorConcentration,
    deskConcentration,
    silentDesks,
    findings,
  }
}
