import type { ArticleBlock, MediaRef } from '@nagarikwatch/db'

/**
 * Picks the share image for a story from every photograph the story actually
 * carries, instead of assuming the hero is the best one — or the only one.
 *
 * Two things were wrong before. A story with no hero but three photographs in
 * the body got the site's default OG asset, so every such share card looked
 * identical. And a hero that is a tall portrait got shipped to a 1.91:1 crop
 * that cuts roughly half of it away, usually through the subject's face.
 *
 * There is no pixel decoding here and there should not be: metadata Next.js
 * already has — dimensions, alt text, caption, credit, position in the body —
 * answers the question well enough, and decoding remote images inside
 * `generateMetadata` would put a network fetch on every article render.
 */

/** Facebook/X/Google all render a 1.91:1 card; 1200x630 is the canonical size. */
const TARGET_RATIO = 1200 / 630
const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 630

/** Below this a crawler either skips the image or renders the small-card layout. */
const MIN_WIDTH = 600
const MIN_HEIGHT = 315

const WEIGHT_CROP = 0.42
const WEIGHT_RESOLUTION = 0.28
const WEIGHT_EDITORIAL = 0.18
const WEIGHT_POSITION = 0.12

/** Dimensions are frequently absent on imported media; absent is not "bad". */
const UNKNOWN_SIZE_SCORE = 0.6

/** Site furniture that happens to live in the media library. */
const NON_EDITORIAL_URL = /(^|[/_-])(logo|icon|avatar|placeholder|sprite|favicon|opengraph-image)/i

/** Alt text that was typed to silence the linter rather than to describe a photo. */
const EMPTY_ALT = /^(image|photo|picture|img|thumbnail|तस्बिर|फोटो|चित्र)[\s\d._-]*$/i

export type ThumbnailOrigin = 'hero' | 'body'

export type ThumbnailCandidate = {
  url: string
  alt?: string
  width?: number
  height?: number
  caption?: string
  credit?: string
  origin: ThumbnailOrigin
  /** 0 for the hero, then body order. Later photos are usually less central. */
  position: number
}

export type ThumbnailReason =
  | 'hero'
  | 'captioned'
  | 'described'
  | 'no-alt'
  | 'deep-crop'
  | 'unknown-size'
  | 'too-small'
  | 'vector'
  | 'non-editorial'
  | 'unusable-url'

export type ScoredThumbnail = {
  candidate: ThumbnailCandidate
  /** 0 when the crawler cannot use it at all. */
  score: number
  /** Share of the frame that survives the 1.91:1 crop, 0–1. */
  cropRetention: number
  usable: boolean
  reasons: ThumbnailReason[]
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Cropping to a fixed aspect keeps `min(ratio, target) / max(ratio, target)` of
 * the area regardless of which way the image is off. A 3:2 landscape keeps 79%;
 * a 4:5 portrait keeps 42%, and what it drops is the top and bottom, which on a
 * news photograph is the head and the context.
 */
export function cropRetention(width?: number, height?: number): number {
  if (!width || !height || width <= 0 || height <= 0) return UNKNOWN_SIZE_SCORE
  const ratio = width / height
  return Math.min(ratio, TARGET_RATIO) / Math.max(ratio, TARGET_RATIO)
}

function resolutionScore(width?: number, height?: number): number {
  if (!width || !height) return UNKNOWN_SIZE_SCORE
  return clamp01(Math.min(width / TARGET_WIDTH, height / TARGET_HEIGHT))
}

function isUsableUrl(url: string): boolean {
  const value = url.trim()
  if (!value) return false
  if (value.startsWith('data:')) return false
  return value.startsWith('/') || value.startsWith('https://') || value.startsWith('http://')
}

function hasRealAlt(alt?: string): boolean {
  const value = alt?.trim() ?? ''
  return value.length >= 8 && !EMPTY_ALT.test(value)
}

export function scoreThumbnail(candidate: ThumbnailCandidate): ScoredThumbnail {
  const reasons: ThumbnailReason[] = []
  const retention = cropRetention(candidate.width, candidate.height)

  const disqualify = (reason: ThumbnailReason): ScoredThumbnail => ({
    candidate,
    score: 0,
    cropRetention: retention,
    usable: false,
    reasons: [reason],
  })

  if (!isUsableUrl(candidate.url)) return disqualify('unusable-url')
  // SVG is a valid <img> source and is not a valid OG image: the crawlers that
  // matter refuse to rasterise it, so the card renders with no picture at all.
  if (/\.svgx?($|\?)/i.test(candidate.url)) return disqualify('vector')
  if (NON_EDITORIAL_URL.test(candidate.url)) return disqualify('non-editorial')
  if (
    candidate.width &&
    candidate.height &&
    (candidate.width < MIN_WIDTH || candidate.height < MIN_HEIGHT)
  )
    return disqualify('too-small')

  if (!candidate.width || !candidate.height) reasons.push('unknown-size')
  if (retention < 0.55) reasons.push('deep-crop')

  const described = hasRealAlt(candidate.alt)
  const captioned = Boolean(candidate.caption?.trim() || candidate.credit?.trim())
  if (described) reasons.push('described')
  else reasons.push('no-alt')
  if (captioned) reasons.push('captioned')
  if (candidate.origin === 'hero') reasons.push('hero')

  // Alt text and a credit line both mean a human handled this file. That is the
  // closest thing to a salience signal available without opening the pixels.
  const editorial = clamp01((described ? 0.6 : 0) + (captioned ? 0.4 : 0))
  const position = 1 / (1 + candidate.position)

  const score = clamp01(
    WEIGHT_CROP * retention +
      WEIGHT_RESOLUTION * resolutionScore(candidate.width, candidate.height) +
      WEIGHT_EDITORIAL * editorial +
      WEIGHT_POSITION * position,
  )

  return { candidate, score, cropRetention: retention, usable: true, reasons }
}

/**
 * Hero first, then body images in reading order. Duplicates are dropped by URL
 * so a hero repeated as the opening body image does not compete with itself.
 */
export function collectThumbnailCandidates(article: {
  heroImage?: MediaRef
  heroCaptionNe?: string
  heroCredit?: string
  bodyNe?: ArticleBlock[]
}): ThumbnailCandidate[] {
  const seen = new Set<string>()
  const out: ThumbnailCandidate[] = []

  const push = (candidate: ThumbnailCandidate) => {
    const key = candidate.url.trim()
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push(candidate)
  }

  if (article.heroImage?.url) {
    push({
      url: article.heroImage.url,
      alt: article.heroImage.alt,
      width: article.heroImage.width,
      height: article.heroImage.height,
      caption: article.heroImage.caption ?? article.heroCaptionNe,
      credit: article.heroImage.credit ?? article.heroCredit,
      origin: 'hero',
      position: 0,
    })
  }

  for (const block of article.bodyNe ?? []) {
    if (block.type !== 'image' || !block.image?.url) continue
    push({
      url: block.image.url,
      alt: block.image.alt,
      width: block.image.width,
      height: block.image.height,
      caption: block.caption ?? block.image.caption,
      credit: block.image.credit,
      origin: 'body',
      // Index in the accepted list, so a deduplicated image does not leave a
      // hole that makes the next photo look further down the page than it is.
      position: out.length,
    })
  }

  return out
}

export function rankThumbnails(candidates: ThumbnailCandidate[]): ScoredThumbnail[] {
  return candidates
    .map(scoreThumbnail)
    .filter((scored) => scored.usable)
    .sort((a, b) => b.score - a.score || a.candidate.position - b.candidate.position)
}

/**
 * Best usable share image, or null when the story has none and the caller
 * should fall back to the site OG asset.
 */
export function pickShareImage(candidates: ThumbnailCandidate[]): ScoredThumbnail | null {
  return rankThumbnails(candidates)[0] ?? null
}
