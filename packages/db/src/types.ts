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
export type WorkflowStage =
  | 'idea'
  | 'assigned'
  | 'draft'
  | 'submitted'
  | 'fact_check'
  | 'copy_edit'
  | 'seo_review'
  | 'legal_review'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'updated'
  | 'archived'
  | 'retracted'

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
  /** Optional topic tags when available on list/card projections. */
  tags?: Tag[]
  publishedAt: string
  /** True only when englishStatus === 'published' AND English fields exist (ADR-007). */
  hasEnglish: boolean
  isBreaking: boolean
  /** Paid-membership story; cards render a visible access marker. */
  premium?: boolean
  /** When true, suppress display ads on the article surface. */
  adFree?: boolean
  /** SEO directive only; a no-index story can still be publicly readable. */
  noIndex?: boolean
  /** Distribution control for Google News sitemap output. */
  includeInNewsSitemap?: boolean
  /** Optional reading-time, used by some card variants. */
  readingMinutes?: number
  /** Province slug (e.g. bagmati) when geo-tagged. */
  province?: string
  /** District slug when geo-tagged. */
  district?: string
  /** Original exclusive / investigation. */
  exclusive?: boolean
  /** Editor-curated pick for the editor-picks desk. */
  editorPick?: boolean
  /** Data-journalism desk flag. */
  dataStory?: boolean
  /** Photo desk: has a gallery or multi-image body. */
  hasGallery?: boolean
  /** Video desk: has an embed/video. */
  hasVideo?: boolean
  /** Fact-check desk status when this is a fact-check piece. */
  factCheckStatus?:
    | 'not_fact_check'
    | 'in_review'
    | 'verified'
    | 'false'
    | 'mixed'
    | 'context_needed'
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
  expertise?: string[]
  beats?: string[]
  email?: string
  joinedAt?: string
  verified?: boolean
  social?: {
    twitter?: string
    facebook?: string
    website?: string
    linkedin?: string
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
  /**
   * Plain text with optional inline shorthand:
   * **bold**, *italic*, ==highlight==, [label](https://…).
   * Never store raw HTML.
   */
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
  editor?: AuthorRef
  factChecker?: AuthorRef
  heroCaptionNe?: string
  heroCaptionEn?: string
  heroCredit?: string
  sourceNotes?: string
  correctionNote?: string
  topic?: Tag
  province?: string
  district?: string
  language?: Locale
  canonicalUrl?: string
  sponsored?: boolean
  sponsorName?: string
  exclusive?: boolean
  premium?: boolean
  /** Suppress display ads for sensitive reporting. */
  adFree?: boolean
  factCheckStatus?:
    | 'not_fact_check'
    | 'in_review'
    | 'verified'
    | 'false'
    | 'mixed'
    | 'context_needed'
  aiSummaryApproved?: boolean
  keyPoints?: string[]
  summary?: string
  visibilityStatus?: 'draft' | 'private' | 'public' | 'noindex'
  corrections?: Correction[]
  updatedAt?: string
  seoTitleNe?: string
  seoTitleEn?: string
  seoDescriptionNe?: string
  seoDescriptionEn?: string
  focusKeyword?: string
  socialImage?: MediaRef
  noindex?: boolean
  doNotRecommend?: boolean
  commentsEnabled?: boolean
  readingMinutes: number
}

export interface Permission {
  id: string
  action: string
  description?: string
}

export interface Role {
  id: string
  name: string
  permissions: Permission[]
}

export interface User {
  id: string
  name: string
  email: string
  roles: Role[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  articleId: string
  userId?: string
  authorName: string
  body: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  parentId?: string
  createdAt: string
}

export interface Poll {
  id: string
  question: string
  options: { id: string; label: string; votes: number }[]
  status: 'draft' | 'open' | 'closed'
}

export interface ReaderSubmission {
  id: string
  title: string
  body: string
  category?: string
  province?: string
  district?: string
  anonymous: boolean
  evidenceUrls: string[]
  status: 'new' | 'reviewing' | 'accepted' | 'declined'
  createdAt: string
}

export interface AuditLog {
  id: string
  actorId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface ApiDataCache<T = unknown> {
  key: string
  source: string
  data: T
  expiresAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Phase 2 data-model extension. Each entity below is scaffolded so the
// recommendation / trending / analytics / moderation modules have a typed
// shape to consume. The Payload collections that persist them land in a later
// phase; for now they live in the shared type contract the same way the core
// content model does, so library code never touches `any`.
// ---------------------------------------------------------------------------

export interface ArticleRevision {
  id: string
  articleId: string
  editorId: string
  stage: WorkflowStage
  snapshotNe: string
  snapshotEn?: string
  note?: string
  createdAt: string
}

export interface Province {
  slug: string
  nameNe: string
  nameEn: string
  capital?: string
  districts?: string[]
}

export interface District {
  slug: string
  provinceSlug: string
  nameNe: string
  nameEn: string
}

export interface MediaAsset extends MediaRef {
  id: string
  filename: string
  mimeType: string
  uploadedById: string
  createdAt: string
}

export interface PollVote {
  id: string
  pollId: string
  optionId: string
  userId?: string
  sessionFingerprint: string
  createdAt: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  locale: Locale
  confirmedAt?: string
  preferences?: string[]
  createdAt: string
  status: 'pending' | 'subscribed' | 'unsubscribed'
}

export interface Bookmark {
  id: string
  userId: string
  articleId: string
  createdAt: string
}

export interface ReadingHistory {
  id: string
  userId: string
  articleId: string
  categorySlug?: string
  tagSlugs?: string[]
  authorSlugs?: string[]
  readAt: string
  scrollDepth?: number
  readingSeconds?: number
  completed?: boolean
}

export interface Follow {
  id: string
  userId: string
  kind: 'topic' | 'author' | 'province' | 'category'
  targetSlug: string
  createdAt: string
}

export interface NotificationPreference {
  userId: string
  breaking: boolean
  followedTopics: boolean
  followedAuthors: boolean
  dailyDigest: boolean
  marketing: boolean
  channels: { push: boolean; email: boolean; sms: boolean }
}

export interface LiveBlog {
  id: string
  articleId: string
  title: string
  status: 'scheduled' | 'live' | 'closed'
  startedAt?: string
  endedAt?: string
}

export interface LiveBlogUpdate {
  id: string
  liveBlogId: string
  authorId: string
  body: string
  pinned: boolean
  createdAt: string
}

export interface AdCampaign {
  id: string
  name: string
  sponsorName?: string
  placementKey: string
  html?: string
  imageUrl?: string
  href?: string
  startsAt: string
  endsAt: string
  status: 'draft' | 'active' | 'paused' | 'ended'
}

export interface AdSlot {
  placementKey: string
  label: string
  width: number
  height: number
  responsive: boolean
}

export interface SponsoredContent {
  articleId: string
  sponsorName: string
  sponsorUrl?: string
  disclosureNe: string
  disclosureEn?: string
}

export interface SeoMetadata {
  path: string
  titleNe?: string
  titleEn?: string
  descriptionNe?: string
  descriptionEn?: string
  canonical?: string
  noindex: boolean
  socialImage?: MediaRef
}

export interface FactCheckClaim {
  id: string
  articleId: string
  claimNe: string
  claimEn?: string
  claimant?: string
  evidenceNe: string
  evidenceEn?: string
  sources: { url: string; label: string }[]
  verdict: 'verified' | 'false' | 'mixed' | 'context_needed'
  reviewedBy?: AuthorRef
  reviewedAt?: string
}

export interface LiveWidgetConfig {
  key: string
  enabled: boolean
  provider?: string
  refreshSeconds: number
  showOnHome: boolean
  showOnArticle: boolean
  adminOverride?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Analytics, recommendation, and moderation events. These power the catalog in
// packages/db/src/events.ts and the client tracker in apps/web/lib/analytics.
// The same names flow into the data warehouse once an ingestion pipeline is
// wired; keeping them in the shared contract avoids a rename later.
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'article_view'
  | 'article_click'
  | 'search'
  | 'share'
  | 'bookmark'
  | 'comment'
  | 'follow_topic'
  | 'follow_author'
  | 'follow_province'
  | 'newsletter_signup'
  | 'notification_click'
  | 'scroll_depth'
  | 'reading_complete'
  | 'poll_vote'
  | 'reader_submission'
  | 'ad_impression'
  | 'ad_click'

export interface AnalyticsEvent {
  name: AnalyticsEventName
  /** ISO timestamp the client observed the event. */
  at: string
  /** Anonymous per-session id (no PII). */
  sessionId: string
  /** Logged-in user id when available. */
  userId?: string
  articleId?: string
  categorySlug?: string
  provinceSlug?: string
  /** Free-form payload; shape depends on `name` (see events.ts per-event schema). */
  props?: Record<string, unknown>
}

export interface SearchEvent {
  id: string
  query: string
  resultCount: number
  clickedArticleId?: string
  locale: Locale
  sessionId: string
  at: string
}

export interface RecommendationEvent {
  id: string
  userId?: string
  sessionId: string
  surface: 'related' | 'home' | 'feed' | 'continue_reading' | 'topic' | 'author'
  candidateIds: string[]
  shownIds: string[]
  clickedId?: string
  /** Ranker version recorded with the impression for reproducible audits. */
  algorithmVersion?: string
  /** Dominant strategy by shown article id; contains no personal data. */
  strategies?: Record<
    string,
    'content' | 'session' | 'freshness' | 'follow' | 'editorial' | 'cold-start'
  >
  at: string
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
  /** Editorial spotlight pool (mid-scroll bands + top grid). Max ~6 in layout. */
  featured: StoryCardData[]
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
