/**
 * Content-source façade. Single import for pages: `import { getHomepage } from '@/lib/content'`.
 *
 * Selection is environment-driven:
 *  - When `PAYLOAD_CONTENT_SOURCE=payload` (set in prod / when a DB is reachable) the
 *    Payload-backed source reads the CMS via the Local API.
 *  - Otherwise the seed-backed source is used, so the site renders real content with zero
 *    infrastructure (clones, previews, tests, Lighthouse against a seeded local DB).
 *
 * Pages never branch on the source; they call the typed helpers below, which match the
 * Phase 1 task acceptance (getArticleBySlug, getCategoryPage, getHomepageBlocks, …).
 *
 * The Payload source is loaded via a dynamic import inside resolveSource() so its
 * `@payload-config` dependency never enters the build graph when the seed path is in use —
 * otherwise Next's bundler fails to resolve a config that only lives in apps/admin.
 */
import 'server-only'
import type {
  Article,
  Author,
  Category,
  HomepageData,
  Locale,
  PaginatedStories,
  Tag,
} from '@nagarikwatch/db'
import type { ContentSource, StoryListOptions } from './source'
import { createSeedContentSource } from './seed-source'

async function resolveSource(): Promise<ContentSource> {
  if (process.env.PAYLOAD_CONTENT_SOURCE === 'payload') {
    const { createPayloadContentSource } = await import('./payload-source')
    return createPayloadContentSource()
  }
  return createSeedContentSource()
}

let cached: ContentSource | null = null
async function source(): Promise<ContentSource> {
  if (!cached) cached = await resolveSource()
  return cached
}

export async function getArticleBySlug(
  category: string,
  slug: string,
  locale: Locale,
): Promise<Article | null> {
  return (await source()).getArticleBySlug(category, slug, locale)
}

export async function getHomepage(): Promise<HomepageData | null> {
  return (await source()).getHomepage()
}

export async function getCategoryPage(
  slug: string,
  page: number,
  locale: Locale,
): Promise<PaginatedStories | null> {
  return (await source()).getCategoryPage(slug, page, locale)
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await source()).getCategory(slug)
}

export async function getNavCategories(): Promise<Category[]> {
  return (await source()).getNavCategories()
}

export async function getStories(opts: StoryListOptions): Promise<PaginatedStories> {
  return (await source()).getStories(opts)
}

export async function getAuthor(
  slug: string,
  locale: Locale,
): Promise<{ author: Author; stories: PaginatedStories } | null> {
  return (await source()).getAuthor(slug, locale)
}

export async function getTag(
  slug: string,
  locale: Locale,
): Promise<{ tag: Tag; stories: PaginatedStories } | null> {
  return (await source()).getTag(slug, locale)
}

export type { ContentSource, StoryListOptions }
