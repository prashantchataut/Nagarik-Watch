/**
 * Alt-text quality scoring for the media library.
 *
 * The catalog entry for this has existed for a long time backed by
 * `clamp01(alt.length / 60)`, which calls a 60-character filename excellent and
 * a precise 20-character description poor. Length is the weakest available
 * signal; the defects that actually reach readers are the ones below —
 * filenames pasted into the field, "photo of" prefixes that a screen reader
 * already announces, and alt text copy-pasted from the caption, which makes the
 * screen reader say the same sentence twice.
 *
 * Scores are advisory. Nothing here blocks an upload: alt text is a judgement
 * call, and a checker that refuses good-but-unusual descriptions would get
 * routed around within a week.
 */

/** Below this an alt attribute is a label, not a description. */
const MIN_USEFUL_CHARS = 15
/** Screen readers do not pause inside alt text; past ~160 chars it belongs in a caption. */
const MAX_USEFUL_CHARS = 160

export type AltTextIssueCode =
  'missing' | 'filename' | 'redundant-prefix' | 'too-short' | 'too-long' | 'duplicates-caption'

export type AltTextIssue = {
  code: AltTextIssueCode
  /** `error` is a real accessibility failure; `warning` is worth an editor's glance. */
  severity: 'error' | 'warning'
}

export type AltTextAssessment = {
  /** 0–1. 1 means nothing found; each issue costs its weight. */
  score: number
  issues: AltTextIssue[]
}

/** `IMG_4821.JPG`, `DSC00012`, `screenshot-2026-03-04-at-11.02.png`. */
const FILENAME =
  /(\.(jpe?g|png|webp|gif|avif|heic)$)|^(img|dsc|dscn|pxl|screenshot|photo)[-_\s]?\d/i
/** Prefixes a screen reader already implies by announcing "image". */
const REDUNDANT_PREFIX =
  /^\s*(an?\s+)?(image|photo(graph)?|picture|graphic|screenshot)\s+(of|showing)\b|^\s*(तस्बिर|फोटो|चित्र)\s*[::-]/iu

const WEIGHTS: Record<AltTextIssueCode, number> = {
  missing: 1,
  filename: 0.8,
  'duplicates-caption': 0.5,
  'redundant-prefix': 0.2,
  'too-short': 0.35,
  'too-long': 0.2,
}

function normalise(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

export function assessAltText(alt: string | null | undefined, caption?: string): AltTextAssessment {
  const text = (alt ?? '').trim()
  if (!text) return { score: 0, issues: [{ code: 'missing', severity: 'error' }] }

  const issues: AltTextIssue[] = []
  if (FILENAME.test(text)) issues.push({ code: 'filename', severity: 'error' })
  if (REDUNDANT_PREFIX.test(text)) issues.push({ code: 'redundant-prefix', severity: 'warning' })
  if (text.length < MIN_USEFUL_CHARS) issues.push({ code: 'too-short', severity: 'warning' })
  if (text.length > MAX_USEFUL_CHARS) issues.push({ code: 'too-long', severity: 'warning' })
  // Identical alt and caption make a screen reader read the same sentence twice;
  // the alt should describe the picture, the caption should say what it means.
  if (caption && normalise(caption) === normalise(text)) {
    issues.push({ code: 'duplicates-caption', severity: 'warning' })
  }

  const penalty = issues.reduce((sum, issue) => sum + WEIGHTS[issue.code], 0)
  return { score: Math.max(0, Math.min(1, 1 - penalty)), issues }
}

export type AltTextAudit = {
  total: number
  /** Items with at least one `error` issue — these fail for a screen-reader user today. */
  failing: number
  /** Items with only `warning` issues. */
  weak: number
  /** Mean score across the audited set; 1 when the set is empty. */
  meanScore: number
  worst: ReadonlyArray<{ id: string; alt: string; assessment: AltTextAssessment }>
}

/** Audit a media set, worst first, so an editor sees the queue rather than a number. */
export function auditAltText(
  items: ReadonlyArray<{ id: string; alt?: string | null; caption?: string | null }>,
  worstLimit = 8,
): AltTextAudit {
  const scored = items.map((item) => ({
    id: item.id,
    alt: (item.alt ?? '').trim(),
    assessment: assessAltText(item.alt, item.caption ?? undefined),
  }))
  const failing = scored.filter((entry) =>
    entry.assessment.issues.some((issue) => issue.severity === 'error'),
  )
  const weak = scored.filter(
    (entry) =>
      entry.assessment.issues.length > 0 &&
      !entry.assessment.issues.some((issue) => issue.severity === 'error'),
  )
  const meanScore = scored.length
    ? scored.reduce((sum, entry) => sum + entry.assessment.score, 0) / scored.length
    : 1
  const worst = [...scored]
    .filter((entry) => entry.assessment.issues.length > 0)
    .sort((a, b) => a.assessment.score - b.assessment.score || a.id.localeCompare(b.id))
    .slice(0, worstLimit)
  return { total: scored.length, failing: failing.length, weak: weak.length, meanScore, worst }
}
