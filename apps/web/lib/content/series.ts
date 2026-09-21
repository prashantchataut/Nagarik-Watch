import type { StoryCardData } from '@nagarikwatch/db'

/**
 * Finds the next installment of a multi-part investigation.
 *
 * The desk has no `series` field, and adding one would only work for stories
 * published after it existed. What the desk does have is the convention every
 * Nepali newsroom already follows in the headline itself — `(भाग २)`,
 * `शृंखला ३`, `दोस्रो भाग`, `Part 2` — so the series is read from the title
 * rather than from metadata nobody has filled in.
 *
 * This matters because "Next story →" on an article page currently points at
 * the closest content match. For a four-part corruption investigation that is
 * almost always part one again, or a different story about the same ministry.
 * A reader who just finished part two wants part three, and nothing else is a
 * substitute for it.
 */

/** Devanagari digits map onto ASCII positionally. */
const DEVANAGARI_DIGITS = '०१२३४५६७८९'

const ORDINAL_WORDS: Record<string, number> = {
  पहिलो: 1,
  दोस्रो: 2,
  तेस्रो: 3,
  चौथो: 4,
  पाँचौं: 5,
  पाँचौ: 5,
  छैटौं: 6,
  छैटौ: 6,
  सातौं: 7,
  सातौ: 7,
  आठौं: 8,
  आठौ: 8,
  नवौं: 9,
  नवौ: 9,
  दसौं: 10,
  दसौ: 10,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
}

const SERIES_MARKER = '(?:भाग|शृंखला|श्रृंखला|खण्ड|part|episode|pt\\.?)'

/** `भाग २`, `Part 3`, `खण्ड-४` — marker first, number after. */
const NUMERIC_AFTER = new RegExp(
  `${SERIES_MARKER}\\s*[-–:]?\\s*([0-9${DEVANAGARI_DIGITS}]{1,3})`,
  'iu',
)
/** `२ भाग` and `दोस्रो भाग` — number or ordinal word first. */
const NUMERIC_BEFORE = new RegExp(`([0-9${DEVANAGARI_DIGITS}]{1,3})\\s*${SERIES_MARKER}`, 'iu')
// `\p{L}` alone stops at the first matra: "दोस्रो" is letters interleaved with
// combining marks, so a Devanagari word only matches as `[\p{L}\p{M}]+`.
const WORD = '[\\p{L}\\p{M}]+'
const ORDINAL_BEFORE = new RegExp(`(${WORD})\\s*${SERIES_MARKER}`, 'iu')

/** Everything the part marker occupies, plus the brackets that usually hold it. */
const MARKER_SPAN = new RegExp(
  `[\\s([–—-]*(?:${WORD}\\s*)?(?:${SERIES_MARKER})\\s*[-–:]?\\s*[0-9${DEVANAGARI_DIGITS}]{0,3}\\s*[)\\]]*`,
  'giu',
)

export type SeriesPart = {
  /** The headline with the part marker removed — the series identity. */
  base: string
  part: number
}

function toNumber(raw: string): number | null {
  let out = ''
  for (const char of raw) {
    const devanagari = DEVANAGARI_DIGITS.indexOf(char)
    if (devanagari >= 0) out += String(devanagari)
    else if (char >= '0' && char <= '9') out += char
    else return null
  }
  const value = Number.parseInt(out, 10)
  return Number.isFinite(value) && value > 0 && value <= 99 ? value : null
}

/** Case, punctuation and whitespace are not part of a series identity. */
function normalizeBase(title: string): string {
  return title
    .replace(MARKER_SPAN, ' ')
    .replace(/[|:–—-]+\s*$/u, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase()
}

/**
 * `null` when the headline carries no part marker. Most headlines do not, and
 * guessing would turn every "Part of the problem" into a series.
 */
export function parseSeriesPart(title: string): SeriesPart | null {
  const value = title?.trim()
  if (!value) return null

  const numericAfter = NUMERIC_AFTER.exec(value)
  const part =
    (numericAfter ? toNumber(numericAfter[1]!) : null) ??
    (() => {
      const before = NUMERIC_BEFORE.exec(value)
      return before ? toNumber(before[1]!) : null
    })() ??
    (() => {
      const ordinal = ORDINAL_BEFORE.exec(value)
      const word = ordinal?.[1]?.toLowerCase()
      return word ? (ORDINAL_WORDS[word] ?? null) : null
    })()

  if (part === null) return null
  const base = normalizeBase(value)
  // A headline that is *only* a part marker is not a series, it is a mistake.
  if (base.length < 4) return null
  return { base, part }
}

/**
 * The installment a reader should go to next: same series base, lowest part
 * number above the current one. Published order is not consulted on purpose —
 * a late-corrected part three must not overtake part four.
 */
export function findSeriesContinuation(
  current: { titleNe: string; titleEn?: string; slug: string },
  candidates: StoryCardData[],
): StoryCardData | null {
  const here = parseSeriesPart(current.titleNe) ?? parseSeriesPart(current.titleEn ?? '')
  if (!here) return null

  let best: { story: StoryCardData; part: number } | null = null
  for (const story of candidates) {
    if (story.slug === current.slug) continue
    const there = parseSeriesPart(story.titleNe) ?? parseSeriesPart(story.titleEn ?? '')
    if (!there || there.base !== here.base) continue
    if (there.part <= here.part) continue
    if (!best || there.part < best.part) best = { story, part: there.part }
  }
  return best?.story ?? null
}

/** The installment before this one, for the "previous" side of the navigator. */
export function findSeriesPrevious(
  current: { titleNe: string; titleEn?: string; slug: string },
  candidates: StoryCardData[],
): StoryCardData | null {
  const here = parseSeriesPart(current.titleNe) ?? parseSeriesPart(current.titleEn ?? '')
  if (!here) return null

  let best: { story: StoryCardData; part: number } | null = null
  for (const story of candidates) {
    if (story.slug === current.slug) continue
    const there = parseSeriesPart(story.titleNe) ?? parseSeriesPart(story.titleEn ?? '')
    if (!there || there.base !== here.base) continue
    if (there.part >= here.part) continue
    if (!best || there.part > best.part) best = { story, part: there.part }
  }
  return best?.story ?? null
}
