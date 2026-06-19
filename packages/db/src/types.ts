/**
 * @nagarikwatch/db — shared content types (the contract between
 * apps/admin (Payload CMS) and apps/web (Next.js reader)). See docs/content-model.md.
 *
 * When the content model changes, update docs/content-model.md AND these types together.
 */

export type Locale = 'ne' | 'en'

/** An Article's source provenance — drives attribution rules (editorial-workflow.md §3). */
export type SourceType = 'original' | 'aggregated' | 'wire'

/** Translation sub-workflow state for the English version (ADR-007). */
export type EnglishStatus = 'none' | 'requested' | 'in_progress' | 'ready' | 'published'

/** Editorial publish-flow stage (editorial-workflow.md §2). */
export type WorkflowStage = 'draft' | 'review' | 'scheduled' | 'published' | 'unpublished'

export interface MediaRef {
  url: string
  alt: string
  width?: number
  height?: number
  credit?: string
  caption?: string
}

export interface AuthorRef {
  id: string
  name: string
  slug: string
}

export interface CategoryRef {
  id: string
  slug: string
  nameNe: string
  nameEn: string
}

/** Shape returned by the web query layer for a story card / list item. */
export interface StoryCardData {
  id: string
  slug: string
  category: CategoryRef
  categoryLabel: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
  heroImage?: MediaRef
  byline: string
  authors: AuthorRef[]
  publishedAt: string
  /** True only when englishStatus === 'published' AND English fields exist (ADR-007). */
  hasEnglish: boolean
  isBreaking: boolean
  /** Optional reading-time, used by some card variants. */
  readingMinutes?: number
}

// ---------------------------------------------------------------------------
// Full content model — see docs/content-model.md. These are the shapes the web query layer
// returns for full pages (article, author, topic, category). The Payload collections (Phase
// 2) produce identical shapes, so site code never changes when the seed swaps for the CMS.
// ---------------------------------------------------------------------------

/** A taxonomy section. Maps to docs/content-model.md §2. */
export interface Category extends CategoryRef {
  descriptionNe?: string
  descriptionEn?: string
  navOrder: number
  showInNav: boolean
}

/** An author / columnist. Maps to docs/content-model.md §3. */
export interface Author extends AuthorRef {
  role: 'staff' | 'columnist' | 'contributor' | 'wire'
  bioNe?: string
  bioEn?: string
  photo?: MediaRef
  social?: {
    twitter?: string
    facebook?: string
  }
  isActive: boolean
}

/** A cross-category tag / topic. Maps to docs/content-model.md §4. */
export interface Tag {
  id: string
  slug: string
  nameNe: string
  nameEn?: string
  descriptionNe?: string
  descriptionEn?: string
}

/** A reader-visible correction. Maps to content-model.md §1 corrections[]. */
export interface Correction {
  at: string
  summaryNe: string
  summaryEn?: string
}

/** Provenance for aggregated / wire content. Drives the attribution line. */
export interface SourceAttribution {
  sourceType: Exclude<SourceType, 'original'>
  sourceName: string
  sourceUrl: string
  sourcePublishedAt: string
}

// Article body blocks — a discriminated union (content-model.md §1 Body blocks). Every
// element maps to a typed React component in ArticleBody, never free HTML.

export interface ParagraphBlock {
  type: 'paragraph'
  /** Plain text. Inline emphasis is out of scope for the seed (no raw HTML). */
  text: string
}

export interface HeadingBlock {
  type: 'heading2' | 'heading3'
  text: string
}

export interface ImageBlock {
  type: 'image'
  image: MediaRef
  caption?: string
}

export interface PullQuoteBlock {
  type: 'pullQuote'
  quoteNe: string
  quoteEn?: string
  attribution?: string
}

export interface EmbedBlock {
  type: 'embed'
  provider: 'youtube' | 'twitter' | 'facebook' | 'custom'
  url: string
  caption?: string
}

export interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

export interface AdSlotBlock {
  type: 'adSlot'
  placementKey: string
}

export type ArticleBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | PullQuoteBlock
  | EmbedBlock
  | ListBlock
  | AdSlotBlock

/** A full article. The page-level shape returned by getArticleBySlug(). */
export interface Article extends StoryCardData {
  bodyNe: ArticleBlock[]
  bodyEn?: ArticleBlock[]
  source?: SourceAttribution
  tags: Tag[]
  heroCaptionNe?: string
  heroCaptionEn?: string
  heroCredit?: string
  corrections?: Correction[]
  updatedAt?: string
  seoTitleNe?: string
  seoTitleEn?: string
  seoDescriptionNe?: string
  seoDescriptionEn?: string
  readingMinutes: number
}

/** A homepage category section block (DESIGN.md §5 SectionBlock). */
export interface HomepageSection {
  category: CategoryRef
  lead?: StoryCardData
  items: StoryCardData[]
}

/** The assembled homepage payload. */
export interface HomepageData {
  lead: StoryCardData
  secondary: StoryCardData[]
  sections: HomepageSection[]
  breaking: StoryCardData[]
}

/** A paginated list response. */
export interface PaginatedStories {
  items: StoryCardData[]
  page: number
  totalPages: number
  total: number
}
