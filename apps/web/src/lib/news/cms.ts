import { blocksFromJson, readingMinutesOf } from '@/lib/blocks'
import type { Block, Story } from '@/lib/news/data'

/**
 * Shared mapper: DB article row → public article shape that mirrors the static
 * Story type (so the client can merge both pools seamlessly).
 */

export interface ArticleRow {
  slug: string
  desk: string
  titleNe: string
  titleEn: string | null
  deckNe: string
  deckEn: string | null
  bodyNe: string
  bodyEn: string | null
  hero: string | null
  heroCredit: string | null
  tags: string
  publishedAt: Date | null
  views: number
  author: { name: string }
}

export interface PublicArticle {
  id: string
  slug: string
  desk: string
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  bodyNe: Block[]
  bodyEn: Block[]
  publishedAt: string
  readingMinutes: number
  featured: 'none'
  location: string
  province: string
  hero: string
  heroCaption: string
  heroCredit: string
  tags: string[]
  author: string
  views: number
  fromDb: true
}

export function toPublicArticle(a: ArticleRow): PublicArticle {
  const bodyNe = blocksFromJson(a.bodyNe)
  let tags: string[] = []
  try {
    const parsed = JSON.parse(a.tags) as unknown
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === 'string')
  } catch {
    tags = []
  }
  return {
    id: a.slug,
    slug: a.slug,
    desk: a.desk,
    titleNe: a.titleNe,
    titleEn: a.titleEn ?? a.titleNe,
    deckNe: a.deckNe,
    deckEn: a.deckEn ?? a.deckNe,
    bodyNe,
    bodyEn: a.bodyEn ? blocksFromJson(a.bodyEn) : bodyNe,
    publishedAt: (a.publishedAt ?? new Date()).toISOString(),
    readingMinutes: readingMinutesOf(bodyNe),
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: a.hero ?? '',
    heroCaption: '',
    heroCredit: a.heroCredit ?? 'नागरिक वाच',
    tags,
    author: a.author.name,
    views: a.views,
    fromDb: true,
  }
}

/** Map a public CMS article to the static Story shape (server + client safe). */
export function dbArticleToStory(a: PublicArticle): Story {
  return {
    slug: a.slug,
    desk: a.desk,
    titleNe: a.titleNe,
    titleEn: a.titleEn,
    deckNe: a.deckNe,
    deckEn: a.deckEn,
    bodyNe: a.bodyNe,
    bodyEn: a.bodyEn,
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    featured: 'none',
    location: a.location,
    province: a.province,
    hero: a.hero,
    heroCaption: a.heroCaption,
    heroCredit: a.heroCredit,
    tags: a.tags,
    author: a.author,
  }
}
