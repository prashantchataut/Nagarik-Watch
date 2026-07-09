/**
 * Payload-backed {@link ContentSource}. Reads the live CMS via Payload's Local API and maps
 * the persisted documents onto the shared `@nagarikwatch/db` shapes — the same shared shapes the
 * store source returns — so rendering code is identical across sources.
 *
 * The Payload config lives in apps/admin; apps/web imports it lazily via
 * `@payload-config` (resolved by the `payload` tsconfig path at build time). The Local API
 * bypasses HTTP entirely (in-process), keeping server reads fast and authentication-free
 * for public read access.
 *
 * Visibility rules: listing pages filter `/en` to reviewed English stories. Direct article
 * URLs can fall back to Nepali with a visible notice so the language toggle never dead-ends.
 */
import 'server-only'
import type {
  Article,
  ArticleBlock,
  Author,
  Category,
  HomepageData,
  Locale,
  MediaRef,
  PaginatedStories,
  StoryCardData,
  Tag,
} from '@nagarikwatch/db'
import type { ContentSource, StoryListOptions } from './source'

const PER_PAGE = 12

type PayloadDoc = Record<string, unknown> & { id: string | number }

type MediaField = {
  url?: string
  alt?: string
  width?: number
  height?: number
  credit?: string
  caption?: string
  filename?: string
  mimeType?: string
} | null

type CategoryField = {
  id: string | number
  slug?: string
  nameNe?: string
  nameEn?: string
  description?: string
  navOrder?: number
  showInNav?: boolean
} | null

type AuthorField = { id: string | number; slug?: string; name?: string } | null

type TagField = { id: string | number; slug?: string; nameNe?: string; nameEn?: string } | null

function asMedia(m: MediaField | undefined, fallbackAlt?: string): MediaRef | undefined {
  if (!m || (!m.url && !m.filename)) return undefined
  const url = m.url ?? (m.filename ? String(m.filename) : '')
  if (!url) return undefined
  return {
    url,
    alt: m.alt ?? fallbackAlt ?? '',
    width: m.width,
    height: m.height,
    credit: m.credit,
    caption: m.caption,
  }
}

function asCategory(c: CategoryField): Category {
  return {
    id: String(c?.id ?? ''),
    slug: String(c?.slug ?? ''),
    nameNe: String(c?.nameNe ?? ''),
    nameEn: String(c?.nameEn ?? ''),
    descriptionNe: c?.description,
    navOrder: Number(c?.navOrder ?? 99),
    showInNav: Boolean(c?.showInNav ?? true),
  }
}

function asCategoryRef(c: CategoryField) {
  return {
    id: String(c?.id ?? ''),
    slug: String(c?.slug ?? ''),
    nameNe: String(c?.nameNe ?? ''),
    nameEn: String(c?.nameEn ?? ''),
  }
}

function asAuthor(a: AuthorField | undefined) {
  if (!a) return null
  return { id: String(a.id ?? ''), slug: String(a.slug ?? ''), name: String(a.name ?? '') }
}

function asTag(t: TagField | undefined): Tag | null {
  if (!t) return null
  return {
    id: String(t.id ?? ''),
    slug: String(t.slug ?? ''),
    nameNe: String(t.nameNe ?? ''),
    nameEn: t.nameEn,
  }
}

function asCard(doc: PayloadDoc): StoryCardData {
  const category = asCategoryRef(doc.category as CategoryField)
  const media = asMedia(doc.heroImage as MediaField)
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    category,
    categoryLabel: category.nameNe,
    titleNe: String(doc.titleNe ?? ''),
    titleEn: doc.titleEn ? String(doc.titleEn) : undefined,
    deckNe: doc.deckNe ? String(doc.deckNe) : undefined,
    deckEn: doc.deckEn ? String(doc.deckEn) : undefined,
    heroImage: media,
    byline: String(doc.byline ?? ''),
    authors: Array.isArray(doc.authors)
      ? (doc.authors as { author?: AuthorField }[])
          .map((row) => asAuthor(row.author))
          .filter((a): a is { id: string; slug: string; name: string } => a !== null)
      : [],
    publishedAt: String(doc.publishedAt ?? doc.updatedAt ?? new Date().toISOString()),
    hasEnglish: String(doc.englishStatus ?? 'none') === 'published',
    isBreaking: Boolean(doc.isBreaking),
    readingMinutes: doc.readingMinutes ? Number(doc.readingMinutes) : undefined,
  }
}

async function getPayload() {
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  return getPayload({ config })
}

export function createPayloadContentSource(): ContentSource {
  const source: ContentSource = {
    async getArticleBySlug(category, slug, locale) {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'articles',
        where: { slug: { equals: slug }, _status: { equals: 'published' } },
        limit: 1,
        depth: 2,
      })
      const doc = docs[0] as unknown as PayloadDoc | undefined
      if (!doc) return null
      const cat = asCategoryRef(doc.category as CategoryField)
      if (cat.slug !== category) return null
      return thisToArticle(doc, locale)
    },

    async getStories(opts: StoryListOptions): Promise<PaginatedStories> {
      const payload = await getPayload()
      const page = opts.page ?? 1
      const perPage = opts.limit && !opts.page ? opts.limit : (opts.perPage ?? PER_PAGE)
      const where: Record<string, unknown> = { _status: { equals: 'published' } }
      if (opts.category) where['category.slug'] = { equals: opts.category }
      if (opts.author) where['authors.author.slug'] = { equals: opts.author }
      if (opts.tag) where['tags.tag.slug'] = { equals: opts.tag }
      if (opts.locale === 'en') where.englishStatus = { equals: 'published' }
      if (opts.exclude?.length) where.slug = { not_in: opts.exclude }
      const { docs, totalDocs, totalPages } = await payload.find({
        collection: 'articles',
        where,
        limit: perPage,
        page,
        sort: '-publishedAt',
        depth: 1,
      })
      const items = (docs as unknown as PayloadDoc[]).map(asCard)
      return {
        items,
        page,
        totalPages: totalPages ?? Math.max(1, Math.ceil((totalDocs ?? items.length) / perPage)),
        total: totalDocs ?? items.length,
      }
    },

    async getHomepage(): Promise<HomepageData | null> {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'articles',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 60,
        depth: 1,
      })
      const rows = docs as unknown as PayloadDoc[]
      const cards = rows.map(asCard)
      const lead = cards[0]
      if (!lead) return null
      const breaking = cards.filter((c) => c.isBreaking).slice(0, 6)
      const { docs: catDocs } = await payload.find({
        collection: 'categories',
        where: { showInNav: { equals: true } },
        sort: 'navOrder',
        limit: 50,
        depth: 0,
      })
      const sections = (catDocs as unknown as PayloadDoc[])
        .map((c) => {
          const items = cards.filter(
            (x) => x.category.slug === String((c as { slug?: string }).slug),
          )
          return {
            category: asCategoryRef(c as CategoryField),
            lead: items[0],
            items: items.slice(1, 5),
          }
        })
        .filter((s) => s.items.length > 0 || s.lead)
      return { lead, secondary: cards.slice(1, 5), sections, breaking }
    },

    async getCategory(slug) {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      const doc = docs[0] as unknown as PayloadDoc | undefined
      return doc ? asCategory(doc as CategoryField) : null
    },

    async getCategoryPage(slug, page, locale) {
      const cat = await source.getCategory(slug)
      if (!cat) return null
      return source.getStories({ category: slug, page, locale })
    },

    async getNavCategories() {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'categories',
        where: { showInNav: { equals: true } },
        sort: 'navOrder',
        limit: 50,
        depth: 0,
      })
      return (docs as unknown as PayloadDoc[]).map((c) => asCategory(c as CategoryField))
    },

    async getFeatured() {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'articles',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 5,
        depth: 1,
      })
      const cards = (docs as unknown as PayloadDoc[]).map(asCard)
      return { lead: cards[0], secondary: cards.slice(1, 5) }
    },

    async getAuthor(slug, locale) {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'authors',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      })
      const doc = docs[0] as unknown as
        | (PayloadDoc & {
            role?: string
            bio?: string
            photo?: MediaField
            isActive?: boolean
          })
        | undefined
      if (!doc) return null
      const author: Author = {
        id: String(doc.id),
        slug: String(doc.slug ?? slug),
        name: String(doc.name ?? ''),
        role: (doc.role as Author['role']) ?? 'staff',
        bioNe: doc.bio,
        photo: asMedia(doc.photo),
        isActive: Boolean(doc.isActive ?? true),
      }
      const stories = await source.getStories({ author: slug, locale })
      return { author, stories }
    },

    async getTag(slug, locale) {
      const payload = await getPayload()
      const { docs } = await payload.find({
        collection: 'tags',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      const doc = docs[0] as unknown as PayloadDoc | undefined
      if (!doc) return null
      const tag: Tag = {
        id: String(doc.id),
        slug: String(doc.slug ?? slug),
        nameNe: String(doc.nameNe ?? ''),
        nameEn: doc.nameEn ? String(doc.nameEn) : undefined,
      }
      const stories = await source.getStories({ tag: slug, locale })
      return { tag, stories }
    },
  }
  return source
}

function thisToArticle(doc: PayloadDoc, locale: Locale): Article {
  const card = asCard(doc)
  const bodyNe = (doc.bodyNe as ArticleBlock[]) ?? []
  const bodyEn =
    locale === 'en'
      ? ((doc.bodyEn as ArticleBlock[]) ?? undefined)
      : (doc.bodyEn as ArticleBlock[] | undefined)
  const sourceType = String(doc.sourceType ?? 'original')
  return {
    ...card,
    bodyNe,
    bodyEn,
    source:
      sourceType !== 'original' && doc.sourceName
        ? {
            sourceType: sourceType as 'aggregated' | 'wire',
            sourceName: String(doc.sourceName),
            sourceUrl: String(doc.sourceUrl ?? ''),
            sourcePublishedAt: String(doc.sourcePublishedAt ?? doc.publishedAt ?? ''),
          }
        : undefined,
    tags: Array.isArray(doc.tags)
      ? (doc.tags as { tag?: TagField }[])
          .map((row) => asTag(row.tag))
          .filter((t): t is Tag => t !== null)
      : [],
    heroCredit: doc.heroCredit ? String(doc.heroCredit) : undefined,
    corrections: Array.isArray(doc.corrections)
      ? (doc.corrections as { at?: string; summary?: string }[]).map((c) => ({
          at: String(c.at ?? ''),
          summaryNe: String(c.summary ?? ''),
        }))
      : undefined,
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
    seoTitleNe: doc.seoTitle ? String(doc.seoTitle) : undefined,
    seoDescriptionNe: doc.seoDescription ? String(doc.seoDescription) : undefined,
    premium: doc.premium === true,
    commentsEnabled: doc.commentsEnabled !== false,
    readingMinutes: Number(doc.readingMinutes ?? Math.max(1, Math.ceil((bodyNe?.length ?? 1) / 4))),
  }
}
