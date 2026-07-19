import 'server-only'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getSharedPool } from '@/lib/pg-pool'

export const REACTION_EMOJIS = ['👍', '❤️', '😮', '😢', '👏', '🔥'] as const
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]

type LocalStore = {
  reactions: Array<{
    articleSlug: string
    articleCategory: string
    emoji: ReactionEmoji
    visitorHash: string
  }>
  votes: Array<{ commentId: string; visitorHash: string }>
}

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'reactions-votes.json')
let cache: LocalStore | null = null
let writeQueue = Promise.resolve()

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.E2E_TEST !== 'true'
}

export function hashVisitor(seed: string): string {
  const secret =
    process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || 'nagarik-watch-local-reaction'
  return createHash('sha256').update(`${secret}:${seed}`).digest('hex')
}

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJIS as readonly string[]).includes(value)
}

async function readLocal(): Promise<LocalStore> {
  if (cache) return cache
  try {
    cache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as LocalStore
  } catch {
    cache = { reactions: [], votes: [] }
  }
  return cache
}

async function writeLocal(next: LocalStore): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(next), 'utf8')
    cache = next
  })
  await writeQueue
}

async function ensureSchema(): Promise<void> {
  const pool = await getSharedPool()
  if (!pool) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_reactions (
      id bigserial PRIMARY KEY,
      article_slug text NOT NULL,
      article_category text NOT NULL DEFAULT '',
      emoji text NOT NULL,
      visitor_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (article_slug, visitor_hash, emoji)
    )
  `)
  await pool.query(
    `ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0`,
  )
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_comment_votes (
      id bigserial PRIMARY KEY,
      comment_id text NOT NULL,
      visitor_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (comment_id, visitor_hash)
    )
  `)
}

export async function reactionCounts(articleSlug: string): Promise<Record<ReactionEmoji, number>> {
  const counts = Object.fromEntries(REACTION_EMOJIS.map((emoji) => [emoji, 0])) as Record<
    ReactionEmoji,
    number
  >
  const pool = await getSharedPool()
  if (pool) {
    await ensureSchema()
    const result = await pool.query<{ emoji: string; count: string | number }>(
      `SELECT emoji, COUNT(*)::int AS count FROM nw_reactions WHERE article_slug=$1 GROUP BY emoji`,
      [articleSlug],
    )
    for (const row of result.rows) {
      if (isReactionEmoji(row.emoji)) counts[row.emoji] = Number(row.count)
    }
    return counts
  }
  if (isProduction()) {
    throw new Error('DATABASE_URL is required for reactions in production.')
  }
  const local = await readLocal()
  for (const row of local.reactions) {
    if (row.articleSlug === articleSlug) counts[row.emoji] += 1
  }
  return counts
}

export async function toggleReaction(input: {
  articleSlug: string
  articleCategory: string
  emoji: ReactionEmoji
  visitorKey: string
}): Promise<{ active: boolean; counts: Record<ReactionEmoji, number> }> {
  const visitorHash = hashVisitor(input.visitorKey)
  const pool = await getSharedPool()
  if (pool) {
    await ensureSchema()
    const existing = await pool.query(
      `SELECT 1 FROM nw_reactions WHERE article_slug=$1 AND visitor_hash=$2 AND emoji=$3`,
      [input.articleSlug, visitorHash, input.emoji],
    )
    if (existing.rowCount) {
      await pool.query(
        `DELETE FROM nw_reactions WHERE article_slug=$1 AND visitor_hash=$2 AND emoji=$3`,
        [input.articleSlug, visitorHash, input.emoji],
      )
      return { active: false, counts: await reactionCounts(input.articleSlug) }
    }
    await pool.query(
      `INSERT INTO nw_reactions (article_slug, article_category, emoji, visitor_hash)
       VALUES ($1,$2,$3,$4)`,
      [input.articleSlug, input.articleCategory, input.emoji, visitorHash],
    )
    return { active: true, counts: await reactionCounts(input.articleSlug) }
  }
  if (isProduction()) {
    throw new Error('DATABASE_URL is required for reactions in production.')
  }
  const local = await readLocal()
  const idx = local.reactions.findIndex(
    (row) =>
      row.articleSlug === input.articleSlug &&
      row.visitorHash === visitorHash &&
      row.emoji === input.emoji,
  )
  let active = false
  if (idx >= 0) local.reactions.splice(idx, 1)
  else {
    local.reactions.push({
      articleSlug: input.articleSlug,
      articleCategory: input.articleCategory,
      emoji: input.emoji,
      visitorHash,
    })
    active = true
  }
  await writeLocal(local)
  return { active, counts: await reactionCounts(input.articleSlug) }
}

export async function toggleCommentVote(input: {
  commentId: string
  visitorKey: string
}): Promise<{ upvoteCount: number; active: boolean }> {
  const visitorHash = hashVisitor(input.visitorKey)
  const pool = await getSharedPool()
  if (pool) {
    await ensureSchema()
    const existing = await pool.query(
      `SELECT 1 FROM nw_comment_votes WHERE comment_id=$1 AND visitor_hash=$2`,
      [input.commentId, visitorHash],
    )
    if (existing.rowCount) {
      await pool.query(`DELETE FROM nw_comment_votes WHERE comment_id=$1 AND visitor_hash=$2`, [
        input.commentId,
        visitorHash,
      ])
      await pool.query(
        `UPDATE nw_comments SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id=$1`,
        [input.commentId],
      )
    } else {
      await pool.query(
        `INSERT INTO nw_comment_votes (comment_id, visitor_hash) VALUES ($1,$2)`,
        [input.commentId, visitorHash],
      )
      await pool.query(`UPDATE nw_comments SET upvote_count = upvote_count + 1 WHERE id=$1`, [
        input.commentId,
      ])
    }
    const count = await pool.query<{ upvote_count: number }>(
      `SELECT upvote_count FROM nw_comments WHERE id=$1`,
      [input.commentId],
    )
    return {
      upvoteCount: Number(count.rows[0]?.upvote_count ?? 0),
      active: !existing.rowCount,
    }
  }
  if (isProduction()) {
    throw new Error('DATABASE_URL is required for comment votes in production.')
  }
  const local = await readLocal()
  const idx = local.votes.findIndex(
    (row) => row.commentId === input.commentId && row.visitorHash === visitorHash,
  )
  let active = false
  if (idx >= 0) local.votes.splice(idx, 1)
  else {
    local.votes.push({ commentId: input.commentId, visitorHash })
    active = true
  }
  await writeLocal(local)
  const upvoteCount = local.votes.filter((row) => row.commentId === input.commentId).length
  return { upvoteCount, active }
}
