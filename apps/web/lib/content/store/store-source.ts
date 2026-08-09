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
import { matchesStoryListFilters, storyHasGallery, storyHasVideo } from '../story-filters'
import { categories, categoryBySlug } from '../seed/categories'
import { authors } from '../seed/authors'
import { tags, tagBySlug } from '../seed/tags'
import * as store from './json-store'
import type { StoredArticle } from './json-store'
import { placeholder } from '../seed/media'
import { normalizeEditionHeroUrl } from './seed-edition/_helpers'
import {
  listContentAuthors,
  listContentCategories,
  listContentTags,
} from '@/lib/taxonomy-admin'
import { isProductionRuntime } from '@/lib/ops-db'

const PER_PAGE = 12

function allowSeedTaxonomyFallback(): boolean {
  return !isProductionRuntime()
}

function resolveCategory(
  slug: string,
  catalog?: TaxonomyCatalog,
): Category | undefined {
  const fromCatalog = catalog?.categories.find((c) => c.slug === slug)
  if (fromCatalog) return fromCatalog
  if (!allowSeedTaxonomyFallback()) return undefined
  return categoryBySlug.get(slug)
}

function resolveAuthor(
  idOrSlug: string,
  catalog?: TaxonomyCatalog,
): Author | undefined {
  const pool = catalog?.authors ?? (allowSeedTaxonomyFallback() ? authors : [])
  return pool.find((au) => au.id === idOrSlug || au.slug === idOrSlug)
}

function resolveTag(slug: string, catalog?: TaxonomyCatalog): Tag | undefined {
  const fromCatalog = catalog?.tags.find((t) => t.slug === slug)
  if (fromCatalog) return fromCatalog
  if (!allowSeedTaxonomyFallback()) return undefined
  return tagBySlug.get(slug)
}

function resolveHero(a: StoredArticle) {
  const raw = a.heroImageUrl?.trim()
  // Production: never invent data: SVG heroes that read as broken photography.
  if (raw && !(isProductionRuntime() && raw.startsWith('data:'))) {
    const url = normalizeEditionHeroUrl(raw, a.slug) ?? raw
    if (!(isProductionRuntime() && url.startsWith('data:'))) {
      return { url, alt: a.heroImageAlt ?? a.titleNe }
    }
  }
  if (isProductionRuntime()) {
    return { url: '', alt: a.heroImageAlt ?? a.titleNe }
  }
  const label =
    (resolveCategory(a.categorySlug)?.nameNe ?? a.categorySlug).slice(0, 28)
  const media = placeholder(a.slug, a.categorySlug, label, a.titleNe, {
    w: 1600,
    h: 900,
  })
  return { url: media.url, alt: media.alt }
}

type TaxonomyCatalog = { authors: Author[]; tags: Tag[]; categories: Category[] }
let taxonomyCache:
  | {
      expiresAt: number
      value: TaxonomyCatalog
    }
  | null = null
const TAXONOMY_CACHE_TTL_MS = 15_000

function toCard(a: StoredArticle, locale: Locale, catalog?: TaxonomyCatalog): StoryCardData {
  const cat = resolveCategory(a.categorySlug, catalog) ?? {
    id: a.categorySlug,
    slug: a.categorySlug,
    nameNe: a.categorySlug,
    nameEn: a.categorySlug,
  }
  const cardAuthors = a.authorIds
    .map((id) => resolveAuthor(id, catalog))
    .filter((au): au is Author => Boolean(au))
  const heroResolved = resolveHero(a)
  const heroImage =
    heroResolved.url.trim().length > 0
      ? heroResolved
      : undefined
  const cardTags = a.tagSlugs
    .map((slug) => resolveTag(slug, catalog))
    .filter((t): t is Tag => Boolean(t))
  return {
    id: a.id,
    slug: a.slug,
    category: cat,
    categoryLabel: locale === 'en' ? (cat.nameEn ?? cat.nameNe) : cat.nameNe,
    titleNe: a.titleNe,
    titleEn: a.titleEn,
    deckNe: a.homepageTeaserNe ?? a.deckNe,
    deckEn: a.deckEn,
    heroImage,
    byline: cardAuthors.map((au) => au.name).join(', '),
    authors: cardAuthors.map((au) => ({ id: au.id, slug: au.slug, name: au.name })),
    tags: cardTags,
    publishedAt: a.publishedAt,
    hasEnglish: a.hasEnglish,
    isBreaking: a.isBreaking,
    premium: a.premium,
    noIndex: a.noIndex,
    includeInNewsSitemap: a.includeInNewsSitemap,
    readingMinutes: a.readingMinutes,
    province: a.province,
    district: a.district,
    exclusive: a.exclusive,
    editorPick: a.editorPick,
    dataStory: a.dataStory,
    hasGallery: storyHasGallery({ hasGallery: a.bodyNe.filter((b) => b.type === 'image').length >= 2, bodyNe: a.bodyNe, heroImage }),
    hasVideo: storyHasVideo({ bodyNe: a.bodyNe }),
    factCheckStatus: a.factCheckStatus,
  } as StoryCardData
}

function toFullArticle(a: StoredArticle, locale: Locale, catalog?: TaxonomyCatalog): Article {
  const card = toCard(a, locale, catalog)
  const cardTags = a.tagSlugs
    .map((slug) => resolveTag(slug, catalog))
    .filter((t): t is Tag => Boolean(t))
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
    ...card,
    deckNe: a.deckNe,
    deckEn: a.deckEn,
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
    province: a.province,
    district: a.district,
    exclusive: a.exclusive,
    factCheckStatus: a.factCheckStatus,
  } as Article
}

async function loadCatalog(): Promise<TaxonomyCatalog> {
  if (taxonomyCache && taxonomyCache.expiresAt > Date.now()) {
    return taxonomyCache.value
  }
  const [categoryList, tagList, authorList] = await Promise.all([
    listContentCategories(),
    listContentTags(),
    listContentAuthors(),
  ])
  const value = { categories: categoryList, tags: tagList, authors: authorList }
  taxonomyCache = { value, expiresAt: Date.now() + TAXONOMY_CACHE_TTL_MS }
  return value
}

export function createStoreContentSource(): ContentSource {
  return {
    async getArticleBySlug(
      category: string,
      slug: string,
      locale: Locale,
    ): Promise<Article | null> {
      const a = await store.getArticleBySlug(category, slug, locale)
      if (!a) return null
      return toFullArticle(a, locale, await loadCatalog())
    },
    async getHomepage(): Promise<HomepageData | null> {
      const [data, catalog] = await Promise.all([store.getHomepageData(), loadCatalog()])
      const lead = data.lead ? toCard(data.lead, 'ne', catalog) : null
      if (!lead) return null
      const sections: HomepageSection[] = data.sections.map((s) => {
        const cat = resolveCategory(s.categorySlug, catalog) ?? {
            id: s.categorySlug,
            slug: s.categorySlug,
            nameNe: s.categorySlug,
            nameEn: s.categorySlug,
          }
        return {
          category: cat,
          items: s.articles.map((a) => toCard(a, 'ne', catalog)),
        }
      })
      return {
        lead,
        featured: data.featured.map((a) => toCard(a, 'ne', catalog)),
        secondary: data.secondary.map((a) => toCard(a, 'ne', catalog)),
        breaking: data.breaking.map((a) => toCard(a, 'ne', catalog)),
        sections,
      }
    },
    async getCategory(slug: string): Promise<Category | null> {
      const catalog = await listContentCategories()
      return catalog.find((c) => c.slug === slug) ?? resolveCategory(slug) ?? null
    },
    async getCategoryPage(
      slug: string,
      page: number,
      locale: Locale,
    ): Promise<PaginatedStories | null> {
      const catalog = await loadCatalog()
      const cat = resolveCategory(slug, catalog)
      if (!cat) return null
      const { items, total } = await store.listArticles({
        category: slug,
        locale,
        limit: PER_PAGE,
        offset: (page - 1) * PER_PAGE,
      })
      return {
        items: items.map((a) => toCard(a, locale, catalog)),
        total,
        page,
        totalPages: Math.ceil(total / PER_PAGE) || 1,
      }
    },
    async getAuthor(
      slug: string,
      locale: Locale,
    ): Promise<{ author: Author; stories: PaginatedStories } | null> {
      const catalog = await loadCatalog()
      const author = resolveAuthor(slug, catalog)
      if (!author) return null
      const all = await store.listArticles({ locale, limit: 1000 })
      const authorArticles = all.items.filter((a) =>
        a.authorIds.some((id) => id === author.id || id === author.slug),
      )
      return {
        author,
        stories: {
          items: authorArticles.map((a) => toCard(a, locale, catalog)),
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
      const catalog = await loadCatalog()
      const tag = resolveTag(slug, catalog)
      if (!tag) return null
      const all = await store.listArticles({ locale, limit: 1000 })
      const tagArticles = all.items.filter((a) => a.tagSlugs.includes(slug))
      return {
        tag,
        stories: {
          items: tagArticles.map((a) => toCard(a, locale, catalog)),
          total: tagArticles.length,
          page: 1,
          totalPages: Math.ceil(tagArticles.length / PER_PAGE) || 1,
        },
      }
    },
    async getStories(opts: StoryListOptions): Promise<PaginatedStories> {
      const locale = opts.locale ?? 'ne'
      const perPage = opts.perPage ?? PER_PAGE
      const page = opts.page ?? 1
      const catalog = await loadCatalog()
      const { items: raw } = await store.listArticles({
        category: opts.category,
        locale: opts.locale,
        limit: 500,
        offset: 0,
      })
      let filtered = raw
      if (opts.author) {
        filtered = filtered.filter((a) =>
          a.authorIds.some((id) => {
            const match = resolveAuthor(id, catalog)
            return match?.slug === opts.author
          }),
        )
      }
      if (opts.tag) {
        filtered = filtered.filter((a) => a.tagSlugs.includes(opts.tag!))
      }
      if (opts.exclude?.length) {
        filtered = filtered.filter((a) => !opts.exclude!.includes(a.slug))
      }
      const cards = filtered
        .map((a) => toCard(a, locale, catalog))
        .filter((card) => matchesStoryListFilters(card, opts))
      const total = cards.length
      const start = (page - 1) * perPage
      let pageItems = cards.slice(start, start + perPage)
      if (opts.limit) pageItems = pageItems.slice(0, opts.limit)
      return {
        items: pageItems,
        total,
        page,
        totalPages: Math.ceil(total / perPage) || 1,
      }
    },
    async getNavCategories(): Promise<Category[]> {
      const terms = await listContentCategories()
      return terms
        .filter((c) => c.showInNav !== false)
        .sort((a, b) => (a.navOrder ?? 0) - (b.navOrder ?? 0))
    },
    async getAuthors(): Promise<Author[]> {
      return listContentAuthors()
    },
    async getTags(): Promise<Tag[]> {
      return listContentTags()
    },
    async getFeatured(): Promise<{ lead?: StoryCardData; secondary: StoryCardData[] }> {
      const [data, catalog] = await Promise.all([store.getHomepageData(), loadCatalog()])
      return {
        lead: data.lead ? toCard(data.lead, 'ne', catalog) : undefined,
        secondary: data.secondary.map((a) => toCard(a, 'ne', catalog)),
      }
    },
  }
}

export { categories as seedCategories, authors as seedAuthors, tags as seedTags }
