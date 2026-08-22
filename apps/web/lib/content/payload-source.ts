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
import { buildPublicArticleWhere } from '@nagarikwatch/db'
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
import { categoryBySlug } from '@/lib/content/seed/categories'

const PER_PAGE = 12
const PAYLOAD_LAST_GOOD_TTL_MS = 15 * 60_000

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
  const slug = String(c?.slug ?? '')
  const seeded = categoryBySlug.get(slug)
  const nameNeRaw = String(c?.nameNe ?? '').trim()
  const nameEnRaw = String(c?.nameEn ?? '').trim()
  const nameNe =
    nameNeRaw && nameNeRaw.toLowerCase() !== slug.toLowerCase()
      ? nameNeRaw
      : seeded?.nameNe?.trim() || nameNeRaw || slug
  const nameEn =
    nameEnRaw && nameEnRaw.toLowerCase() !== slug.toLowerCase()
      ? nameEnRaw
      : seeded?.nameEn?.trim() || nameEnRaw || ''
  return {
    id: String(c?.id ?? ''),
    slug,
    nameNe,
    nameEn,
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

function publicArticleWhere(now = Date.now()): Record<string, unknown> {
  // Use the exact request time. Flooring this value for cache reuse can make an
  // immediately published story miss the first post-webhook ISR render, which
  // then leaves that route stale for its full page revalidate interval.
  return buildPublicArticleWhere(new Date(now).toISOString()) as Record<string, unknown>
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

function placementActive(doc: PayloadDoc, now = Date.now()): boolean {
  const raw = doc.featuredExpiresAt
  if (!raw) return true
  const expires = Date.parse(String(raw))
  return Number.isNaN(expires) || expires > now
}

function asCard(doc: PayloadDoc): StoryCardData {
  const category = asCategoryRef(doc.category as CategoryField)
  const media = asMedia(doc.heroImage as MediaField)
  const authors = Array.isArray(doc.authors)
    ? (doc.authors as { author?: AuthorField }[])
        .map((row) => asAuthor(row.author))
        .filter((author): author is { id: string; slug: string; name: string } => author !== null)
    : []
  const tags = Array.isArray(doc.tags)
    ? (doc.tags as { tag?: TagField }[])
        .map((row) => asTag(row.tag))
        .filter((tag): tag is Tag => tag !== null)
    : []
  const bodyNe = Array.isArray(doc.bodyNe) ? (doc.bodyNe as ArticleBlock[]) : []
  const imageBlocks = bodyNe.filter((b) => b.type === 'image').length
  const hasVideo = bodyNe.some(
    (b) => b.type === 'embed' && (b.provider === 'youtube' || /youtu|vimeo|video/i.test(b.url)),
  )
  return {
    id: String(doc.id),
    slug: String(doc.slug ?? ''),
    category,
    categoryLabel: category.nameNe,
    titleNe: String(doc.titleNe ?? ''),
    titleEn: doc.titleEn ? String(doc.titleEn) : undefined,
    deckNe: doc.homepageTeaserNe
      ? String(doc.homepageTeaserNe)
      : doc.deckNe
        ? String(doc.deckNe)
        : undefined,
    deckEn: doc.deckEn ? String(doc.deckEn) : undefined,
    heroImage: media,
    byline: String(doc.byline ?? authors.map((author) => author.name).join(', ')),
    authors,
    tags,
    publishedAt: stablePublicationDate(doc),
    hasEnglish: String(doc.englishStatus ?? 'none') === 'published',
    isBreaking: Boolean(doc.isBreaking),
    premium: doc.premium === true,
    adFree: doc.adFree === true,
    noIndex: doc.noIndex === true,
    includeInNewsSitemap: doc.includeInNewsSitemap !== false,
    readingMinutes: doc.readingMinutes ? Number(doc.readingMinutes) : undefined,
    province: doc.province ? String(doc.province) : undefined,
    district: doc.district ? String(doc.district) : undefined,
    exclusive: doc.exclusive === true,
    editorPick: doc.editorPick === true,
    dataStory: doc.dataStory === true,
    hasGallery: imageBlocks >= 2 || Boolean(doc.photoGallery),
    hasVideo,
    factCheckStatus: doc.factCheckStatus
      ? (String(doc.factCheckStatus) as StoryCardData['factCheckStatus'])
      : undefined,
  }
}

type PayloadFindOptions = {
  where?: Record<string, unknown>
  sort?: string
  limit?: number
  page?: number
  depth?: number
  revalidateSeconds?: number
}

type PayloadFindResult<T> = {
  docs: T[]
  totalDocs?: number
  totalPages?: number
  page?: number
}

const payloadLastKnownGood = new Map<
  string,
  { value: PayloadFindResult<PayloadDoc>; expiresAt: number }
>()

function payloadLastKnownGoodKey(endpoint: string): string {
  const url = new URL(endpoint)
  for (const key of url.searchParams.keys()) {
    if (key.includes('[and]') && key.endsWith('[publishAt][less_than_equal]')) {
      url.searchParams.set(key, 'PUBLICATION_CUTOFF')
    }
  }
  return url.toString()
}

function appendPayloadWhere(
  params: URLSearchParams,
  where: Record<string, unknown>,
  prefix = 'where',
): void {
  for (const [field, operators] of Object.entries(where)) {
    if ((field === 'and' || field === 'or') && Array.isArray(operators)) {
      operators.forEach((clause, index) => {
        if (!clause || typeof clause !== 'object' || Array.isArray(clause)) return
        appendPayloadWhere(
          params,
          clause as Record<string, unknown>,
          `${prefix}[${field}][${index}]`,
        )
      })
      continue
    }
    if (!operators || typeof operators !== 'object' || Array.isArray(operators)) continue
    for (const [operator, rawValue] of Object.entries(operators as Record<string, unknown>)) {
      const value = Array.isArray(rawValue) ? rawValue.join(',') : String(rawValue)
      params.set(`${prefix}[${field}][${operator}]`, value)
    }
  }
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

  appendPayloadWhere(params, options.where ?? {})

  const revalidateSeconds = Math.max(0, Number(options.revalidateSeconds ?? 0))
  const timeoutMs = Math.max(
    1_500,
    Math.min(10_000, Number(process.env.NW_PAYLOAD_READ_TIMEOUT_MS ?? 4_000)),
  )
  const endpoint = `${payloadServerUrl()}/api/${collection}?${params.toString()}`
  const lastKnownGoodKey = payloadLastKnownGoodKey(endpoint)

  try {
    const response = await fetch(endpoint, {
      cache: revalidateSeconds > 0 ? 'force-cache' : 'no-store',
      next: revalidateSeconds > 0 ? { revalidate: revalidateSeconds } : undefined,
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const body = (await response.json().catch(() => ({}))) as PayloadFindResult<T> & {
      errors?: Array<{ message?: string }>
      message?: string
    }
    if (!response.ok) {
      const message =
        body.errors?.[0]?.message || body.message || `Payload read failed: ${response.status}`
      throw new Error(message)
    }

    const value: PayloadFindResult<T> = {
      ...body,
      docs: Array.isArray(body.docs) ? body.docs : [],
    }
    payloadLastKnownGood.set(lastKnownGoodKey, {
      value: value as PayloadFindResult<PayloadDoc>,
      expiresAt: Date.now() + PAYLOAD_LAST_GOOD_TTL_MS,
    })
    return value
  } catch (error) {
    const cached = payloadLastKnownGood.get(lastKnownGoodKey)
    if (cached && cached.expiresAt >= Date.now()) {
      return cached.value as PayloadFindResult<T>
    }
    if (cached) payloadLastKnownGood.delete(lastKnownGoodKey)
    throw error
  }
}

export async function createPayloadContentSource(): Promise<ContentSource> {
  const source: ContentSource = {
    async getArticleBySlug(category, slug, locale) {
      const { docs } = await payloadFind<PayloadDoc>('articles', {
        where: { ...publicArticleWhere(), slug: { equals: slug } },
        limit: 1,
        depth: 2,
        revalidateSeconds: 15,
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
      const where: Record<string, unknown> = publicArticleWhere()
      if (opts.category) where['category.slug'] = { equals: opts.category }
      if (opts.author) where['authors.author.slug'] = { equals: opts.author }
      if (opts.tag) where['tags.tag.slug'] = { equals: opts.tag }
      if (opts.locale === 'en') where.englishStatus = { equals: 'published' }
      if (opts.exclude?.length) where.slug = { not_in: opts.exclude }
      if (opts.province) where.province = { equals: opts.province }
      if (opts.district) where.district = { equals: opts.district }
      if (opts.exclusive === true) where.exclusive = { equals: true }
      if (opts.editorPick === true) where.editorPick = { equals: true }
      if (opts.dataStory === true) where.dataStory = { equals: true }
      if (opts.factCheck === true) {
        where.factCheckStatus = {
          in: ['in_review', 'verified', 'false', 'mixed', 'context_needed'],
        }
      }
      if (opts.dateFrom) {
        where.publishAt = {
          ...((where.publishAt as Record<string, unknown> | undefined) ?? {}),
          greater_than_equal: opts.dateFrom,
        }
      }
      if (opts.dateTo) {
        where.publishAt = {
          ...((where.publishAt as Record<string, unknown> | undefined) ?? {}),
          less_than_equal: opts.dateTo,
        }
      }
      if (opts.q?.trim()) {
        where.or = [
          { titleNe: { contains: opts.q.trim() } },
          { titleEn: { contains: opts.q.trim() } },
          { deckNe: { contains: opts.q.trim() } },
        ]
      }
      // Gallery/video desks need body inspection — fetch a wider page then filter.
      const needsBodyFilter = opts.hasGallery === true || opts.hasVideo === true
      const { docs, totalDocs, totalPages } = await payloadFind<PayloadDoc>('articles', {
        where,
        limit: needsBodyFilter ? Math.max(perPage * 4, 48) : perPage,
        page: needsBodyFilter ? 1 : page,
        sort: '-publishAt',
        depth: 1,
        revalidateSeconds: needsBodyFilter ? 30 : 20,
      })
      let items = (docs as unknown as PayloadDoc[]).map(asCard)
      if (opts.hasGallery === true) items = items.filter((c) => c.hasGallery)
      if (opts.hasVideo === true) items = items.filter((c) => c.hasVideo)
      if (needsBodyFilter) {
        const total = items.length
        const start = (page - 1) * perPage
        items = items.slice(start, start + perPage)
        return {
          items,
          page,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
          total,
        }
      }
      return {
        items,
        page,
        totalPages: totalPages ?? Math.max(1, Math.ceil((totalDocs ?? items.length) / perPage)),
        total: totalDocs ?? items.length,
      }
    },

    async getHomepage(): Promise<HomepageData | null> {
      const publishedWhere = publicArticleWhere()
      // One bounded article request is enough to compose the whole homepage.
      // The previous implementation made four near-identical cross-service
      // article requests on a cold render, multiplying Payload cold-start/DB
      // latency and making the reader feel slow whenever the CMS was unhealthy.
      const [{ docs }, categoryResult] = await Promise.all([
        payloadFind<PayloadDoc>('articles', {
          where: publishedWhere,
          sort: '-publishAt',
          limit: 120,
          depth: 1,
          revalidateSeconds: 20,
        }),
        payloadFind<PayloadDoc>('categories', {
          where: { showInNav: { equals: true } },
          sort: 'navOrder',
          limit: 50,
          depth: 0,
          revalidateSeconds: 120,
        }).catch(() => ({ docs: [] as PayloadDoc[] })),
      ])

      const rows = docs as unknown as PayloadDoc[]
      const cards = rows.map(asCard)
      if (!cards.length) return null

      const activeRows = rows.filter((doc) => placementActive(doc))
      const editorialLead = activeRows.filter((doc) => doc.featuredState === 'lead').map(asCard)[0]
      const lead = editorialLead ?? cards[0]!
      const editorialFeatured = activeRows
        .filter((doc) => doc.featuredState === 'featured')
        .map(asCard)
      const editorialSecondary = activeRows
        .filter((doc) => doc.featuredState === 'secondary')
        .map(asCard)
      const fallbackPool = cards.filter((card) => card.id !== lead.id)
      const featured = Array.from(
        new Map(
          [
            ...editorialFeatured,
            ...fallbackPool.filter((c) => c.editorPick || c.exclusive),
            ...fallbackPool,
            ...cards,
          ].map((card) => [card.id, card]),
        ).values(),
      ).slice(0, 6)
      const secondary = Array.from(
        new Map(
          [...editorialSecondary, ...fallbackPool, ...cards].map((card) => [card.id, card]),
        ).values(),
      ).slice(0, 6)
      const breaking = cards.filter((card) => card.isBreaking).slice(0, 6)
      const categoryDocs =
        categoryResult.docs.length > 0
          ? (categoryResult.docs as PayloadDoc[])
          : Array.from(
              new Map(
                rows
                  .map((row) => row.category as PayloadDoc | undefined)
                  .filter((category): category is PayloadDoc => Boolean(category?.id))
                  .map((category) => [String(category.slug ?? category.id), category]),
              ).values(),
            )
      const sections = categoryDocs
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
      return { lead, featured, secondary, sections, breaking }
    },

    async getCategory(slug) {
      const { docs } = await payloadFind<PayloadDoc>('categories', {
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        revalidateSeconds: 120,
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
        revalidateSeconds: 120,
      })
      return (docs as unknown as PayloadDoc[]).map((c) => asCategory(c as CategoryField))
    },

    async getAuthors() {
      const { docs } = await payloadFind<PayloadDoc>('authors', {
        where: { isActive: { equals: true } },
        sort: 'name',
        limit: 500,
        depth: 1,
        revalidateSeconds: 180,
      })
      return (
        docs as unknown as Array<
          PayloadDoc & {
            role?: string
            bio?: string
            photo?: MediaField
            isActive?: boolean
          }
        >
      ).map((doc) => ({
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
        revalidateSeconds: 180,
      })
      return (docs as unknown as PayloadDoc[])
        .map((doc) => asTag(doc as TagField))
        .filter((tag): tag is Tag => tag !== null)
    },

    async getFeatured() {
      const publishedWhere = publicArticleWhere()
      const [{ docs: latestDocs }, { docs: leadDocs }, { docs: secondaryDocs }] = await Promise.all(
        [
          payloadFind<PayloadDoc>('articles', {
            where: publishedWhere,
            sort: '-publishAt',
            limit: 5,
            depth: 1,
            revalidateSeconds: 20,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'lead' } },
            sort: '-publishAt',
            limit: 1,
            depth: 1,
            revalidateSeconds: 20,
          }),
          payloadFind<PayloadDoc>('articles', {
            where: { ...publishedWhere, featuredState: { equals: 'secondary' } },
            sort: '-publishAt',
            limit: 4,
            depth: 1,
            revalidateSeconds: 20,
          }),
        ],
      )
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
        revalidateSeconds: 60,
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
        revalidateSeconds: 120,
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
    adFree: doc.adFree === true,
    noIndex: doc.noIndex === true,
    includeInNewsSitemap: doc.includeInNewsSitemap !== false,
    noindex: doc.noIndex === true,
    doNotRecommend: doc.doNotRecommend === true,
    commentsEnabled: doc.commentsEnabled === true,
    province: doc.province ? String(doc.province) : undefined,
    district: doc.district ? String(doc.district) : undefined,
    exclusive: doc.exclusive === true,
    factCheckStatus: doc.factCheckStatus
      ? (String(doc.factCheckStatus) as Article['factCheckStatus'])
      : undefined,
    readingMinutes: Number(
      doc.readingMinutes ?? Math.max(1, Math.ceil(countArticleWords(bodyNe) / 180)),
    ),
  }
}
