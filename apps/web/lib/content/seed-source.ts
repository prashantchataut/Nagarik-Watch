/**
 * Seed-backed {@link ContentSource}. Reads the in-repo bilingual seed (no database) so the
 * reader site, its tests, and previews render real content the moment the repo is cloned.
 *
 * It mirrors the exact visibility rules the Payload source enforces server-side (ADR-007):
 * the English locale only sees stories with `hasEnglish` true, and never unpublished work.
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
import type { ContentSource, StoryListOptions } from './source'
import { articlesBatch1 } from './seed/articles-1'
import { articlesBatch2 } from './seed/articles-2'
import { categories, categoryBySlug } from './seed/categories'
import { authors, authorBySlug } from './seed/authors'
import { tags, tagBySlug } from './seed/tags'

const ALL_ARTICLES: Article[] = [...articlesBatch1, ...articlesBatch2]

const PER_PAGE = 12

function visibleForLocale(a: Article, locale: Locale): boolean {
  if (locale === 'en') return a.hasEnglish
  return true
}

function byPublishedDesc(a: { publishedAt: string }, b: { publishedAt: string }): number {
  return b.publishedAt.localeCompare(a.publishedAt)
}

function toCard(a: Article): StoryCardData {
  const { bodyNe: _bodyNe, bodyEn: _bodyEn, ...card } = a
  void _bodyNe
  void _bodyEn
  return card
}

function paginate(items: StoryCardData[], page: number, perPage: number): PaginatedStories {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    totalPages,
    total,
  }
}

export function createSeedContentSource(): ContentSource {
  return {
    async getArticleBySlug(category, slug, locale) {
      const a = ALL_ARTICLES.find((x) => x.slug === slug && x.category.slug === category)
      if (!a) return null
      if (!visibleForLocale(a, locale)) return null
      return a
    },

    async getStories(opts: StoryListOptions): Promise<PaginatedStories> {
      const exclude = new Set(opts.exclude ?? [])
      const locale = opts.locale ?? 'ne'
      const filtered = ALL_ARTICLES.filter((a) => {
        if (!visibleForLocale(a, locale)) return false
        if (opts.category && a.category.slug !== opts.category) return false
        if (opts.author && !a.authors.some((au) => au.slug === opts.author)) return false
        if (opts.tag && !a.tags.some((t) => t.slug === opts.tag)) return false
        if (exclude.has(a.slug)) return false
        return true
      }).sort(byPublishedDesc)

      const cards = filtered.map(toCard)
      if (opts.limit && !opts.page) {
        const limited = cards.slice(0, opts.limit)
        return { items: limited, page: 1, totalPages: 1, total: cards.length }
      }
      const perPage = opts.perPage ?? PER_PAGE
      return paginate(cards, opts.page ?? 1, perPage)
    },

    async getHomepage(): Promise<HomepageData | null> {
      const sorted = [...ALL_ARTICLES].sort(byPublishedDesc)
      const lead = sorted[0]
      if (!lead) return null
      const breaking = sorted.filter((a) => a.isBreaking).map(toCard)
      const sections = categories
        .filter((c) => c.showInNav)
        .map((c) => {
          const items = sorted
            .filter((a) => a.category.slug === c.slug)
            .slice(0, 5)
            .map(toCard)
          return {
            category: { id: c.id, slug: c.slug, nameNe: c.nameNe, nameEn: c.nameEn },
            lead: items[0],
            items: items.slice(1),
          }
        })
        .filter((s) => s.items.length > 0 || s.lead)
      const secondary = sorted.slice(1, 5).map(toCard)
      return { lead: toCard(lead), secondary, sections, breaking }
    },

    async getCategory(slug): Promise<Category | null> {
      return categoryBySlug.get(slug) ?? null
    },

    async getCategoryPage(slug, page, locale): Promise<PaginatedStories | null> {
      if (!categoryBySlug.has(slug)) return null
      return this.getStories({ category: slug, page, locale })
    },

    async getNavCategories(): Promise<Category[]> {
      return categories.filter((c) => c.showInNav).sort((a, b) => a.navOrder - b.navOrder)
    },

    async getFeatured() {
      const sorted = [...ALL_ARTICLES].sort(byPublishedDesc)
      const lead = sorted[0] ? toCard(sorted[0]) : undefined
      return { lead, secondary: sorted.slice(1, 5).map(toCard) }
    },

    async getAuthor(slug) {
      const author = authorBySlug.get(slug)
      if (!author) return null
      const stories = await this.getStories({ author: slug, locale: 'ne' })
      return { author, stories }
    },

    async getTag(slug) {
      const tag = tagBySlug.get(slug)
      if (!tag) return null
      const stories = await this.getStories({ tag: slug, locale: 'ne' })
      return { tag, stories }
    },
  }
}

export const seedArticles: Article[] = ALL_ARTICLES
export const seedAuthors: Author[] = authors
export const seedTags: Tag[] = tags
export const seedCategories: Category[] = categories
