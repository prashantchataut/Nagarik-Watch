/**
 * Analytics event catalog — the single source of truth for event names, the
 * per-event property shape, and which events carry reader PII vs. anonymous
 * signals. The client tracker (apps/web/lib/analytics) and any future server-
 * side ingestion both import from here so the contract cannot drift.
 *
 * Events are grouped by surface so the catalog stays scannable. Every event is
 * listed explicitly (no dynamic names) so a misspelled event fails typecheck
 * rather than silently producing untracked data.
 */
import type { AnalyticsEventName } from './types'

export type EventSchema = {
  name: AnalyticsEventName
  surface: 'article' | 'search' | 'engagement' | 'growth' | 'ads' | 'community'
  description: string
  requiredProps: readonly string[]
  optionalProps: readonly string[]
}

export const EVENT_CATALOG: readonly EventSchema[] = [
  {
    name: 'article_view',
    surface: 'article',
    description: 'Fired when an article body enters the viewport (server-counted as a pageview).',
    requiredProps: ['articleId'],
    optionalProps: ['categorySlug', 'authorSlug', 'referrer', 'provinceSlug'],
  },
  {
    name: 'article_click',
    surface: 'article',
    description: 'Fired when a reader clicks a story card from any surface.',
    requiredProps: ['articleId'],
    optionalProps: ['surface', 'position', 'categorySlug'],
  },
  {
    name: 'search',
    surface: 'search',
    description: 'Fired on submit of a search query, with result count for no-result detection.',
    requiredProps: ['query'],
    optionalProps: ['resultCount', 'clickedArticleId'],
  },
  {
    name: 'share',
    surface: 'engagement',
    description: 'Fired when a reader shares an article to a channel.',
    requiredProps: ['articleId', 'channel'],
    optionalProps: [],
  },
  {
    name: 'bookmark',
    surface: 'engagement',
    description: 'Fired on bookmark add/remove.',
    requiredProps: ['articleId', 'action'],
    optionalProps: [],
  },
  {
    name: 'comment',
    surface: 'community',
    description: 'Fired when a comment is posted or a reply is submitted.',
    requiredProps: ['articleId'],
    optionalProps: ['parentId', 'commentId'],
  },
  {
    name: 'follow_topic',
    surface: 'community',
    description: 'Fired when a reader follows or unfollows a topic.',
    requiredProps: ['topicSlug', 'action'],
    optionalProps: [],
  },
  {
    name: 'follow_author',
    surface: 'community',
    description: 'Fired when a reader follows or unfollows an author.',
    requiredProps: ['authorSlug', 'action'],
    optionalProps: [],
  },
  {
    name: 'follow_province',
    surface: 'community',
    description: 'Fired when a reader follows or unfollows a province.',
    requiredProps: ['provinceSlug', 'action'],
    optionalProps: [],
  },
  {
    name: 'newsletter_signup',
    surface: 'growth',
    description: 'Fired on confirmed newsletter subscription.',
    requiredProps: ['locale'],
    optionalProps: ['source'],
  },
  {
    name: 'notification_click',
    surface: 'engagement',
    description: 'Fired when a reader opens a push/email notification.',
    requiredProps: ['notificationId'],
    optionalProps: ['channel', 'articleId'],
  },
  {
    name: 'scroll_depth',
    surface: 'article',
    description: 'Fired at 25/50/75/100% scroll milestones on an article.',
    requiredProps: ['articleId', 'depth'],
    optionalProps: [],
  },
  {
    name: 'reading_complete',
    surface: 'article',
    description: 'Fired when the reader reaches the end-of-article sentinel.',
    requiredProps: ['articleId'],
    optionalProps: ['readingSeconds'],
  },
  {
    name: 'poll_vote',
    surface: 'community',
    description: 'Fired when a reader votes in a poll.',
    requiredProps: ['pollId', 'optionId'],
    optionalProps: [],
  },
  {
    name: 'reader_submission',
    surface: 'community',
    description: 'Fired when a reader submits a story tip.',
    requiredProps: ['submissionId'],
    optionalProps: ['categorySlug', 'provinceSlug', 'anonymous'],
  },
  {
    name: 'ad_impression',
    surface: 'ads',
    description: 'Fired when an ad slot becomes visible.',
    requiredProps: ['placementKey'],
    optionalProps: ['campaignId'],
  },
  {
    name: 'ad_click',
    surface: 'ads',
    description: 'Fired when a reader clicks an ad.',
    requiredProps: ['placementKey'],
    optionalProps: ['campaignId'],
  },
] as const

export const EVENT_NAMES = EVENT_CATALOG.map((e) => e.name) as readonly AnalyticsEventName[]

export function schemaFor(name: AnalyticsEventName): EventSchema | undefined {
  return EVENT_CATALOG.find((e) => e.name === name)
}

export function isValidEventName(name: string): name is AnalyticsEventName {
  return EVENT_NAMES.includes(name as AnalyticsEventName)
}
