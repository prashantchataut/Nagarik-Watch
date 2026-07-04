/**
 * Content-source façade. Single import for pages: `import { getHomepage } from '@/lib/content'`.
 *
 * v3 selection is environment-driven:
 *  - `PAYLOAD_CONTENT_SOURCE=payload` → Payload CMS (prod, needs DATABASE_URL).
 *  - Otherwise → the JSON-file store source. Editors create articles via /admin;
 *    they persist to data/articles.json (dev) or in-memory (prod read-only FS).
 *    The site renders honest empty states when no articles exist — never fake content.
 *
 * The seed source is gone (v3 removed all copyrighted seed articles). The store
 * source is the default; it reads from the JSON store which starts empty.
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
import { createStoreContentSource } from './store/store-source'

async function resolveSource(): Promise<ContentSource> {
  if (process.env.PAYLOAD_CONTENT_SOURCE === 'payload') {
    const { createPayloadContentSource } = await import('./payload-source')
    return createPayloadContentSource()
  }
  return createStoreContentSource()
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
