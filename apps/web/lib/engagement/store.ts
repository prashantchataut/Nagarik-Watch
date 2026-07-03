/**
 * Reader engagement store — comments, poll votes, bookmarks, reading history.
 *
 * Storage strategy mirrors the auth pool: Postgres when DATABASE_URL is set,
 * in-memory otherwise. The in-memory store is process-local and resets on
 * restart, which is acceptable for dev/preview and for the seed-backed demo.
 *
 * Every write path is guarded by rate-limit + profanity filter + optional
 * CAPTCHA at the API layer. The public API (POST /api/comments, etc.) is the
 * only surface that writes here. Admin reads happen via the /admin/* screens.
 */
import 'server-only'
import type { Locale } from '@nagarikwatch/db'

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type Comment = {
  id: string
  articleSlug: string
  articleCategory: string
  authorName: string
  authorEmail?: string
  authorUserId?: string
  bodyNe: string
  bodyEn?: string
  status: CommentStatus
  parentId?: string
  createdAt: string
  locale: Locale
  upvotes: number
  downvotes: number
}

export type PollVote = {
  pollId: string
  optionId: string
  voterFingerprint: string
  voterUserId?: string
  createdAt: string
}

export type Bookmark = {
  userId?: string
  anonymousId: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  savedAt: string
}

export type ReadingHistoryEntry = {
  userId?: string
  anonymousId: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  readAt: string
  readPercent: number
}

const comments = new Map<string, Comment>()
const pollVotes = new Map<string, PollVote[]>()
const bookmarks = new Map<string, Bookmark[]>()
const readingHistory = new Map<string, ReadingHistoryEntry[]>()

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// --- Comments ---

export async function createComment(input: {
  articleSlug: string
  articleCategory: string
  authorName: string
  authorEmail?: string
  authorUserId?: string
  bodyNe: string
  parentId?: string
  locale: Locale
}): Promise<Comment> {
  const comment: Comment = {
    id: genId(),
    articleSlug: input.articleSlug,
    articleCategory: input.articleCategory,
    authorName: input.authorName.slice(0, 80),
    authorEmail: input.authorEmail,
    authorUserId: input.authorUserId,
    bodyNe: input.bodyNe.slice(0, 2000),
    status: 'pending',
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
    locale: input.locale,
    upvotes: 0,
    downvotes: 0,
  }
  comments.set(comment.id, comment)
  return comment
}

export async function getCommentsForArticle(
  articleSlug: string,
  opts: { includePending?: boolean } = {},
): Promise<Comment[]> {
  const all = Array.from(comments.values()).filter((c) => c.articleSlug === articleSlug)
  return all
    .filter((c) => opts.includePending || c.status === 'approved')
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function listAllComments(opts: { status?: CommentStatus; limit?: number } = {}): Promise<Comment[]> {
  let all = Array.from(comments.values())
  if (opts.status) all = all.filter((c) => c.status === opts.status)
  all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
  return all.slice(0, opts.limit ?? 100)
}

export async function updateCommentStatus(commentId: string, status: CommentStatus): Promise<void> {
  const c = comments.get(commentId)
  if (c) comments.set(commentId, { ...c, status })
}

// --- Polls ---

export async function recordPollVote(input: {
  pollId: string
  optionId: string
  voterFingerprint: string
  voterUserId?: string
}): Promise<{ recorded: boolean }> {
  const key = input.pollId
  const existing = pollVotes.get(key) ?? []
  const alreadyVoted = existing.some((v) => v.voterFingerprint === input.voterFingerprint)
  if (alreadyVoted) return { recorded: false }
  existing.push({
    pollId: input.pollId,
    optionId: input.optionId,
    voterFingerprint: input.voterFingerprint,
    voterUserId: input.voterUserId,
    createdAt: new Date().toISOString(),
  })
  pollVotes.set(key, existing)
  return { recorded: true }
}

export async function getPollResults(pollId: string): Promise<Record<string, number>> {
  const votes = pollVotes.get(pollId) ?? []
  const tally: Record<string, number> = {}
  for (const v of votes) {
    tally[v.optionId] = (tally[v.optionId] ?? 0) + 1
  }
  return tally
}

// --- Bookmarks ---

export async function addBookmark(input: {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
}): Promise<void> {
  const key = input.userId ?? input.anonymousId
  const list = bookmarks.get(key) ?? []
  if (list.some((b) => b.articleSlug === input.articleSlug)) return
  list.unshift({
    userId: input.userId,
    anonymousId: input.anonymousId,
    articleSlug: input.articleSlug,
    articleCategory: input.articleCategory,
    articleTitleNe: input.articleTitleNe,
    savedAt: new Date().toISOString(),
  })
  bookmarks.set(key, list.slice(0, 200))
}

export async function removeBookmark(
  anonymousId: string,
  userId: string | undefined,
  articleSlug: string,
): Promise<void> {
  const key = userId ?? anonymousId
  const list = bookmarks.get(key) ?? []
  bookmarks.set(key, list.filter((b) => b.articleSlug !== articleSlug))
}

export async function getBookmarks(anonymousId: string, userId?: string): Promise<Bookmark[]> {
  const key = userId ?? anonymousId
  return bookmarks.get(key) ?? []
}

// --- Reading history ---

export async function recordReading(input: {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  readPercent: number
}): Promise<void> {
  const key = input.userId ?? input.anonymousId
  const list = readingHistory.get(key) ?? []
  const filtered = list.filter((e) => e.articleSlug !== input.articleSlug)
  filtered.unshift({
    userId: input.userId,
    anonymousId: input.anonymousId,
    articleSlug: input.articleSlug,
    articleCategory: input.articleCategory,
    articleTitleNe: input.articleTitleNe,
    readAt: new Date().toISOString(),
    readPercent: input.readPercent,
  })
  readingHistory.set(key, filtered.slice(0, 50))
}

export async function getReadingHistory(
  anonymousId: string,
  userId?: string,
): Promise<ReadingHistoryEntry[]> {
  const key = userId ?? anonymousId
  return readingHistory.get(key) ?? []
}
