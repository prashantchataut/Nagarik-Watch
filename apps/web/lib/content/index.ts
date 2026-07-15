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
import { isPayloadCanonical } from './payload-admin-client'

async function resolveSource(): Promise<ContentSource> {
  const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'

  if (isPayloadCanonical() && !isProductionBuild) {
    const { createPayloadContentSource } = await import('./payload-source')
    return createPayloadContentSource()
  }

  return createStoreContentSource()
}

let cached: Promise<ContentSource> | null = null

async function source(): Promise<ContentSource> {
  if (!cached) {
    cached = resolveSource().catch((error) => {
      cached = null
      throw error
    })
  }
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

export async function getAuthors(): Promise<Author[]> {
  return (await source()).getAuthors()
}

export async function getTags(): Promise<Tag[]> {
  return (await source()).getTags()
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
