/**
 * Content source contract — the seam between the reader site and where content lives.
 *
 * Two implementations ship today:
 *  - {@link PayloadContentSource}: reads the live CMS via Payload Local API (prod, with DB).
 *  - {@link SeedContentSource}: reads the in-repo seed (dev/preview/tests, no DB required).
 *
 * Pages and components depend only on this contract and the `@nagarikwatch/db` types, so
 * the source can be swapped by environment without touching rendering code. The default
 * export in ./payload-client picks the right one based on env; tests inject the seed.
 */
import type {
  Article,
  Author,
  Category,
  HomepageData,
  Locale,
  PaginatedStories,
  StoryCardData,
  Tag,
} from '@nagarikwatch/db'

export type StoryListOptions = {
  /** 1-based page number. */
  page?: number
  /** Items per page. */
  perPage?: number
  /** Restrict to this category slug. */
  category?: string
  /** Restrict to this author slug. */
  author?: string
  /** Restrict to this tag slug. */
  tag?: string
  /** Restrict to a locale's visibility rules (ADR-007: /en only sees englishStatus=published). */
  locale?: Locale
  /** Exclude these slugs (e.g. the lead story on a homepage section). */
  exclude?: string[]
  /** Cap the number returned (handy for "related" picks). */
  limit?: number
}

export type ContentSource = {
  getArticleBySlug(category: string, slug: string, locale: Locale): Promise<Article | null>
  getHomepage(): Promise<HomepageData | null>
  getCategory(slug: string): Promise<Category | null>
  getCategoryPage(slug: string, page: number, locale: Locale): Promise<PaginatedStories | null>
  getAuthor(slug: string, locale: Locale): Promise<{ author: Author; stories: PaginatedStories } | null>
  getTag(slug: string, locale: Locale): Promise<{ tag: Tag; stories: PaginatedStories } | null>
  getStories(opts: StoryListOptions): Promise<PaginatedStories>
  /** Categories that should appear in primary navigation, ordered by navOrder. */
  getNavCategories(): Promise<Category[]>
  /** Lead/secondary picks for the homepage hero band. */
  getFeatured(): Promise<{ lead?: StoryCardData; secondary: StoryCardData[] }>
}
