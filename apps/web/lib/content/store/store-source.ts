/**
 * Store-backed content source. Reads articles from the JSON-file store
 * instead of hardcoded seed files. v3 content pipeline: editors create
 * content via /admin, it persists to the store, the reader site reads it.
 * When the store is empty, the site renders honest empty states.
 */
import 'server-only'
import type {
  Article,
  Author,
  Category,
  HomepageData,
  HomepageSection,
  Locale,
  PaginatedStories,
  StoryCardData,
  Tag,
} from '@nagarikwatch/db'
import type { ContentSource, StoryListOptions } from '../source'
import { categories, categoryBySlug } from '../seed/categories'
import { authors, authorBySlug } from '../seed/authors'
import { tags, tagBySlug } from '../seed/tags'
import * as store from './json-store'
import type { StoredArticle } from './json-store'

const PER_PAGE = 12

function toCard(a: StoredArticle, locale: Locale): StoryCardData {
  const cat = categoryBySlug.get(a.categorySlug) ?? {
    id: a.categorySlug,
    slug: a.categorySlug,
    nameNe: a.categorySlug,
    nameEn: a.categorySlug,
  }
  const cardAuthors = a.authorIds
    .map((id) => authors.find((au) => au.id === id))
    .filter((au): au is Author => Boolean(au))
  const heroImage = a.heroImageUrl ? { url: a.heroImageUrl, alt: a.heroImageAlt ?? '' } : undefined
  return {
    id: a.id,
    slug: a.slug,
    category: cat,
    categoryLabel: locale === 'en' ? (cat.nameEn ?? cat.nameNe) : cat.nameNe,
    titleNe: a.titleNe,
    titleEn: a.titleEn,
    deckNe: a.deckNe,
    deckEn: a.deckEn,
    heroImage,
    byline: cardAuthors.map((au) => au.name).join(', '),
    authors: cardAuthors.map((au) => ({ id: au.id, slug: au.slug, name: au.name })),
    publishedAt: a.publishedAt,
    hasEnglish: a.hasEnglish,
    isBreaking: a.isBreaking,
    readingMinutes: a.readingMinutes,
  } as StoryCardData
}

function toFullArticle(a: StoredArticle, locale: Locale): Article {
  const cardTags = a.tagSlugs.map((slug) => tagBySlug.get(slug)).filter((t): t is Tag => Boolean(t))
  const source =
    a.sourceType !== 'original' && a.sourceName && a.sourceUrl
      ? {
          sourceType: a.sourceType,
          sourceName: a.sourceName,
          sourceUrl: a.sourceUrl,
          sourcePublishedAt: a.publishedAt,
        }
      : undefined
  return {
    ...toCard(a, locale),
    bodyNe: a.bodyNe,
    bodyEn: a.bodyEn,
    source,
    tags: cardTags,
    heroCaptionNe: a.heroCaptionNe,
    heroCredit: a.heroCredit,
    seoTitleNe: a.seoTitleNe,
    seoDescriptionNe: a.seoDescriptionNe,
    noindex: a.noIndex,
    premium: a.premium,
    commentsEnabled: a.commentsEnabled,
    readingMinutes: a.readingMinutes,
    updatedAt: a.updatedAt,
  } as Article
}

export function createStoreContentSource(): ContentSource {
  return {
    async getArticleBySlug(
      category: string,
      slug: string,
      locale: Locale,
    ): Promise<Article | null> {
      const a = await store.getArticleBySlug(category, slug, locale)
      return a ? toFullArticle(a, locale) : null
    },
    async getHomepage(): Promise<HomepageData | null> {
      const data = await store.getHomepageData()
      const lead = data.lead ? toCard(data.lead, 'ne') : null
      if (!lead) return null
      const sections: HomepageSection[] = data.sections.map((s) => {
        const cat = categoryBySlug.get(s.categorySlug) ?? {
          id: s.categorySlug,
          slug: s.categorySlug,
          nameNe: s.categorySlug,
          nameEn: s.categorySlug,
        }
        return {
          category: cat,
          items: s.articles.map((a) => toCard(a, 'ne')),
        }
      })
      return {
        lead,
        secondary: data.secondary.map((a) => toCard(a, 'ne')),
        breaking: data.breaking.map((a) => toCard(a, 'ne')),
        sections,
      }
    },
    async getCategory(slug: string): Promise<Category | null> {
      return categoryBySlug.get(slug) ?? null
    },
    async getCategoryPage(
      slug: string,
      page: number,
      locale: Locale,
    ): Promise<PaginatedStories | null> {
      const cat = categoryBySlug.get(slug)
      if (!cat) return null
      const { items, total } = await store.listArticles({
        category: slug,
        locale,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      })
      return {
        items: items.map((a) => toCard(a, locale)),
        total,
        page,
        totalPages: Math.ceil(total / PER_PAGE) || 1,
      }
    },
    async getAuthor(
      slug: string,
      locale: Locale,
    ): Promise<{ author: Author; stories: PaginatedStories } | null> {
      const author = authorBySlug.get(slug)
      if (!author) return null
      const all = await store.listArticles({ locale, limit: 1000 })
      const authorArticles = all.items.filter((a) => a.authorIds.includes(author.id))
      return {
        author,
        stories: {
          items: authorArticles.map((a) => toCard(a, locale)),
          total: authorArticles.length,
          page: 1,
          totalPages: Math.ceil(authorArticles.length / PER_PAGE) || 1,
        },
      }
    },
    async getTag(
      slug: string,
      locale: Locale,
    ): Promise<{ tag: Tag; stories: PaginatedStories } | null> {
      const tag = tagBySlug.get(slug)
      if (!tag) return null
      const all = await store.listArticles({ locale, limit: 1000 })
      const tagArticles = all.items.filter((a) => a.tagSlugs.includes(slug))
      return {
        tag,
        stories: {
          items: tagArticles.map((a) => toCard(a, locale)),
          total: tagArticles.length,
          page: 1,
          totalPages: Math.ceil(tagArticles.length / PER_PAGE) || 1,
        },
      }
    },
    async getStories(opts: StoryListOptions): Promise<PaginatedStories> {
      const { items, total } = await store.listArticles({
        category: opts.category,
        locale: opts.locale,
        limit: opts.perPage ?? PER_PAGE,
        offset: ((opts.page ?? 1) - 1) * (opts.perPage ?? PER_PAGE),
      })
      let filtered = items
      if (opts.exclude) filtered = filtered.filter((a) => !opts.exclude!.includes(a.slug))
      if (opts.limit) filtered = filtered.slice(0, opts.limit)
      const locale = opts.locale ?? 'ne'
      return {
        items: filtered.map((a) => toCard(a, locale)),
        total,
        page: opts.page ?? 1,
        totalPages: Math.ceil(total / (opts.perPage ?? PER_PAGE)) || 1,
      }
    },
    async getNavCategories(): Promise<Category[]> {
      return categories
        .filter((c) => c.navOrder !== undefined)
        .sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0))
    },
    async getFeatured(): Promise<{ lead?: StoryCardData; secondary: StoryCardData[] }> {
      const data = await store.getHomepageData()
      return {
        lead: data.lead ? toCard(data.lead, 'ne') : undefined,
        secondary: data.secondary.map((a) => toCard(a, 'ne')),
      }
    },
  }
}

export { categories as seedCategories, authors as seedAuthors, tags as seedTags }
