/**
 * Payload-backed {@link ContentSource}. The CMS is a separate application, so
 * the reader app consumes Payload's public REST API instead of importing the
 * Payload config or opening a second database connection.
 *
 * Visibility rules: listing pages filter `/en` to reviewed English stories.
 * Direct article URLs can fall back to Nepali with a visible notice so the
 * language toggle never dead-ends.
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
import { payloadServerUrl } from './payload-admin-client'

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

type TagField = {
  id: string | number
  slug?: string
  nameNe?: string
  nameEn?: string
  description?: string
} | null

function asMedia(m: MediaField | undefined, fallbackAlt?: string): MediaRef | undefined {
  if (!m || (!m.url && !m.filename)) return undefined
  const rawUrl = m.url ?? (m.filename ? String(m.filename) : '')
  if (!rawUrl) return undefined
  const url = rawUrl.startsWith('/') ? `${payloadServerUrl()}${rawUrl}` : rawUrl
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
    descriptionNe: t.description,
  }
}

function stablePublicationDate(doc: PayloadDoc): string {
  for (const candidate of [doc.publishAt, doc.createdAt, doc.updatedAt]) {
    if (typeof candidate !== 'string') continue
    const timestamp = Date.parse(candidate)
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString()
  }
  // Content without a trustworthy date sorts to the bottom instead of pretending to be fresh.
  return '1970-01-01T00:00:00.000Z'
}

function publicArticleWhere(): Record<string, Record<string, unknown>> {
  return {
    _status: { equals: 'published' },
    workflowStage: { in: ['scheduled', 'published', 'updated'] },
    publishAt: { less_than_equal: new Date().toISOString() },
    noIndex: { not_equals: true },
  }
}

function countArticleWords(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 0
  const text = blocks
    .flatMap((rawBlock) => {
      if (!rawBlock || typeof rawBlock !== 'object') return []
      const block = rawBlock as Record<string, unknown>
      if (typeof block.text === 'string') return [block.text]
      if (typeof block.quoteNe === 'string') return [block.quoteNe]
      if (Array.isArray(block.items)) {
        return block.items.filter((item): item is string => typeof item === 'string')
      }
      return []
    })
    .join(' ')
    .trim()
  return text ? text.split(/\s+/).length : 0
}

function asCard(doc: PayloadDoc): StoryCardData {
  const category = asCategoryRef(doc.category as CategoryField)
  const media = asMedia(doc.heroImage as MediaField)
  const authors = Array.isArray(doc.authors)
    ? (doc.authors as { author?: AuthorField }[])
        .map((row) => asAuthor(row.author))
        .filter((author): author is { id: string; slug: string; name: string } => author !== null)
    : []
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    category,
    categoryLabel: category.nameNe,
    titleNe: String(doc.titleNe ?? ''),
    titleEn: doc.titleEn ? String(doc.titleEn) : undefined,
    deckNe: doc.homepageTeaserNe
      ? String(doc.homepageTeaserNe)
      : doc.deckNe ? String(doc.deckNe) : undefined,
    deckEn: doc.deckEn ? String(doc.deckEn) : undefined,
    heroImage: media,
    byline: String(doc.byline ?? authors.map((author) => author.name).join(', ')),
    authors,
    publishedAt: stablePublicationDate(doc),
    hasEnglish: String(doc.englishStatus ?? 'none') === 'published',
    isBreaking: Boolean(doc.isBreaking),
    premium: doc.premium === true,
    readingMinutes: doc.readingMinutes ? Number(doc.readingMinutes) : undefined,
  }
}

type PayloadFindOptions = {
  where?: Record<string, Record<string, unknown>>
  sort?: string
  limit?: number
  page?: number
  depth?: number
}

type PayloadFindResult<T> = {
  docs: T[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

async function payloadFind<T extends PayloadDoc>(
  collection: 'articles' | 'categories' | 'authors' | 'tags',
  options: PayloadFindOptions = {},
): Promise<PayloadFindResult<T>> {
  const params = new URLSearchParams()
  if (options.sort) params.set('sort', options.sort)
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.page !== undefined) params.set('page', String(options.page))
  if (options.depth !== undefined) params.set('depth', String(options.depth))

  for (const [field, operators] of Object.entries(options.where ?? {})) {
    for (const [operator, rawValue] of Object.entries(operators)) {
      const value = Array.isArray(rawValue) ? rawValue.join(',') : String(rawValue)
      params.set(`where[${field}][${operator}]`, value)
    }
  }

  const response = await fetch(
    `${payloadServerUrl()}/api/${collection}?${params.toString()}`,
    { cache: 'no-store', headers: { accept: 'application/json' } },
  )
  const body = (await response.json().catch(() => ({}))) as PayloadFindResult<T> & {
    errors?: Array<{ message?: string }>
    message?: string
  }
  if (!response.ok) {
    const message = body.errors?.[0]?.message || body.message || `Payload read failed: ${response.status}`
    throw new Error(message)
  }
  return { ...body, docs: Array.isArray(body.docs) ? body.docs : [] }
}

export async function createPayloadContentSource(): Promise<ContentSource> {
  const source: ContentSource = {
    async getArticleBySlug(category, slug, locale) {
      const { docs } = await payloadFind<PayloadDoc>('articles', {
        where: { ...publicArticleWhere(), slug: { equals: slug } },
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
      const page = opts.page ?? 1
      const perPage = opts.limit && !opts.page ? opts.limit : (opts.perPage ?? PER_PAGE)
      const where: Record<string, Record<string, unknown>> = publicArticleWhere()
      if (opts.category) where['category.slug'] = { equals: opts.category }
      if (opts.author) where['authors.author.slug'] = { equals: opts.author }
      if (opts.tag) where['tags.tag.slug'] = { equals: opts.tag }
      if (opts.locale === 'en') where.englishStatus = { equals: 'published' }
      if (opts.exclude?.length) where.slug = { not_in: opts.exclude }
      const { docs, totalDocs, totalPages } = await payloadFind<PayloadDoc>('articles', {
        where,
        limit: perPage,
        page,
        sort: '-publishAt',
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
      const publishedWhere = publicArticleWhere()
      const [{ docs }, { docs: leadDocs }, { docs: secondaryDocs }, { docs: catDocs }] =
        await Promise.all([
          payloadFind<PayloadDoc>('articles', {
            where: publishedWhere,
            sort: '-publishAt',
            limit: 60,
            depth: 1,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'lead' } },
            sort: '-publishAt',
            limit: 1,
            depth: 1,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'secondary' } },
            sort: '-publishAt',
            limit: 4,
            depth: 1,
          }),
          payloadFind<PayloadDoc>('categories', {
            where: { showInNav: { equals: true } },
            sort: 'navOrder',
            limit: 50,
            depth: 0,
          }),
        ])

      const rows = docs as unknown as PayloadDoc[]
      const cards = rows.map(asCard)
      if (!cards.length) return null

      const editorialLead = (leadDocs as unknown as PayloadDoc[]).map(asCard)[0]
      const lead = editorialLead ?? cards[0]!
      const editorialSecondary = (secondaryDocs as unknown as PayloadDoc[]).map(asCard)
      const fallbackSecondary = cards.filter((card) => card.id !== lead.id)
      const secondary = Array.from(
        new Map([...editorialSecondary, ...fallbackSecondary].map((card) => [card.id, card])).values(),
      ).slice(0, 4)
      const breaking = cards.filter((card) => card.isBreaking).slice(0, 6)
      const sections = (catDocs as unknown as PayloadDoc[])
        .map((categoryDoc) => {
          const items = cards.filter(
            (card) => card.category.slug === String((categoryDoc as { slug?: string }).slug),
          )
          return {
            category: asCategoryRef(categoryDoc as CategoryField),
            lead: items[0],
            items: items.slice(1, 5),
          }
        })
        .filter((section) => section.items.length > 0 || section.lead)
      return { lead, secondary, sections, breaking }
    },

    async getCategory(slug) {
      const { docs } = await payloadFind<PayloadDoc>('categories', {
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
      const { docs } = await payloadFind<PayloadDoc>('categories', {
        where: { showInNav: { equals: true } },
        sort: 'navOrder',
        limit: 50,
        depth: 0,
      })
      return (docs as unknown as PayloadDoc[]).map((c) => asCategory(c as CategoryField))
    },

    async getAuthors() {
      const { docs } = await payloadFind<PayloadDoc>('authors', {
        where: { isActive: { equals: true } },
        sort: 'name',
        limit: 500,
        depth: 1,
      })
      return (docs as unknown as Array<PayloadDoc & {
        role?: string
        bio?: string
        photo?: MediaField
        isActive?: boolean
      }>).map((doc) => ({
        id: String(doc.id),
        slug: String(doc.slug ?? ''),
        name: String(doc.name ?? ''),
        role: (doc.role as Author['role']) ?? 'staff',
        bioNe: doc.bio,
        photo: asMedia(doc.photo),
        isActive: Boolean(doc.isActive ?? true),
      }))
    },

    async getTags() {
      const { docs } = await payloadFind<PayloadDoc>('tags', {
        sort: 'nameNe',
        limit: 1000,
        depth: 0,
      })
      return (docs as unknown as PayloadDoc[])
        .map((doc) => asTag(doc as TagField))
        .filter((tag): tag is Tag => tag !== null)
    },

    async getFeatured() {
      const publishedWhere = publicArticleWhere()
      const [{ docs: latestDocs }, { docs: leadDocs }, { docs: secondaryDocs }] =
        await Promise.all([
          payloadFind<PayloadDoc>('articles', {
            where: publishedWhere,
            sort: '-publishAt',
            limit: 5,
            depth: 1,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'lead' } },
            sort: '-publishAt',
            limit: 1,
            depth: 1,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'secondary' } },
            sort: '-publishAt',
            limit: 4,
            depth: 1,
          }),
        ])
      const latest = (latestDocs as unknown as PayloadDoc[]).map(asCard)
      const lead = (leadDocs as unknown as PayloadDoc[]).map(asCard)[0] ?? latest[0]
      if (!lead) return { lead: undefined, secondary: [] }
      const secondary = Array.from(
        new Map(
          [
            ...(secondaryDocs as unknown as PayloadDoc[]).map(asCard),
            ...latest.filter((card) => card.id !== lead.id),
          ].map((card) => [card.id, card]),
        ).values(),
      ).slice(0, 4)
      return { lead, secondary }
    },

    async getAuthor(slug, locale) {
      const { docs } = await payloadFind<PayloadDoc>('authors', {
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
      const { docs } = await payloadFind<PayloadDoc>('tags', {
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      const doc = docs[0] as unknown as PayloadDoc | undefined
      if (!doc) return null
      const tag = asTag(doc as TagField)
      if (!tag) return null
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
    deckNe: doc.deckNe ? String(doc.deckNe) : undefined,
    deckEn: doc.deckEn ? String(doc.deckEn) : undefined,
    bodyNe,
    bodyEn,
    source:
      sourceType !== 'original' && doc.sourceName
        ? {
            sourceType: sourceType as 'aggregated' | 'wire',
            sourceName: String(doc.sourceName),
            sourceUrl: String(doc.sourceUrl ?? ''),
            sourcePublishedAt: String(doc.sourcePublishedAt ?? ''),
          }
        : undefined,
    tags: Array.isArray(doc.tags)
      ? (doc.tags as { tag?: TagField }[])
          .map((row) => asTag(row.tag))
          .filter((t): t is Tag => t !== null)
      : [],
    heroCaptionNe: doc.heroCaption ? String(doc.heroCaption) : undefined,
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
    noindex: doc.noIndex === true,
    doNotRecommend: doc.doNotRecommend === true,
    commentsEnabled: doc.commentsEnabled !== false,
    readingMinutes: Number(
      doc.readingMinutes ?? Math.max(1, Math.ceil(countArticleWords(bodyNe) / 180)),
    ),
  }
}
