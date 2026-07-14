import 'server-only'
import { getArticleBySlug } from '@/lib/content'

export type PublicArticleIdentity = {
  slug: string
  category: string
  titleNe: string
  tagSlugs: string[]
  authorSlugs: string[]
}

type CacheEntry = {
  expiresAt: number
  value: Promise<PublicArticleIdentity | null>
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 5 * 60_000
const MAX_ENTRIES = 500

/**
 * Resolve client-supplied article identifiers against the canonical public content source.
 * Engagement APIs use the returned title/category rather than trusting browser payloads.
 */
export async function getPublicArticleIdentity(
  category: string,
  slug: string,
): Promise<PublicArticleIdentity | null> {
  const key = `${category}:${slug}`
  const now = Date.now()
  const existing = cache.get(key)
  if (existing && existing.expiresAt > now) return existing.value

  const value = getArticleBySlug(category, slug, 'ne')
    .then((article) =>
      article
        ? {
            slug: article.slug,
            category: article.category.slug,
            titleNe: article.titleNe,
            tagSlugs: article.tags.map((tag) => tag.slug),
            authorSlugs: article.authors.map((author) => author.slug),
          }
        : null,
    )
    .catch((error) => {
      cache.delete(key)
      throw error
    })

  cache.set(key, { expiresAt: now + TTL_MS, value })
  if (cache.size > MAX_ENTRIES) {
    for (const [candidate, entry] of cache) {
      if (entry.expiresAt <= now || cache.size > MAX_ENTRIES) cache.delete(candidate)
      if (cache.size <= MAX_ENTRIES) break
    }
  }
  return value
}
