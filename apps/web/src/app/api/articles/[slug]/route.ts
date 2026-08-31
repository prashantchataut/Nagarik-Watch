import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { blocksToJson, parseBodyBlocks, wordCount } from '@/lib/blocks'
import { fail, ok, parseBody, requireJournalist, limitOr429 } from '@/lib/api'
import { toPublicArticle } from '@/lib/news/cms'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ slug: string }> }

/** Public: single article by slug — published for everyone, drafts only for
 *  their author (preview) or editors. */
export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params
  const article = await db.article.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  })
  if (!article) return fail('समाचार भेटिएन।', 404)

  if (article.status !== 'published') {
    const me = await currentUser()
    const isAuthor = me?.kind === 'journalist' && me.id === article.authorId
    const isEditor = me?.kind === 'journalist' && me.role === 'editor'
    if (!isAuthor && !isEditor) return fail('यो समाचार अझै प्रकाशित भएको छैन।', 403)
  }

  return ok({ article: toPublicArticle(article), status: article.status })
}

const patchSchema = z.object({
  action: z.enum(['submit', 'retract', 'publish', 'decline']).optional(),
  editorNote: z.string().trim().max(600).optional(),
  desk: z.string().min(1).optional(),
  titleNe: z.string().trim().min(5, 'शीर्षक कम्तीमा ५ अक्षरको हुनुपर्छ।').optional(),
  titleEn: z.string().trim().max(300).optional().or(z.literal('')),
  deckNe: z.string().trim().min(10, 'सारांश कम्तीमा १० अक्षरको हुनुपर्छ।').optional(),
  deckEn: z.string().trim().max(500).optional().or(z.literal('')),
  bodyNe: z.string().trim().min(30, 'समाचारको मुख्य भाग कम्तीमा ३० अक्षरको हुनुपर्छ।').optional(),
  bodyEn: z.string().trim().optional().or(z.literal('')),
  hero: z.string().trim().optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
})

/** Author edits / submits; editors publish, decline and correct. */
export async function PATCH(req: Request, ctx: Ctx) {
  const limited = limitOr429(req, 'article-write', 40, 10 * 60 * 1000)
  if (limited) return limited

  const guard = await requireJournalist()
  if ('error' in guard) return guard.error
  const me = guard.journalist

  const { slug } = await ctx.params
  const article = await db.article.findUnique({ where: { slug } })
  if (!article) return fail('समाचार भेटिएन।', 404)

  const isAuthor = article.authorId === me.id
  const isEditor = me.role === 'editor'
  if (!isAuthor && !isEditor) return fail('यो समाचार तपाईंको होइन।', 403)

  const { data, error } = await parseBody(req, patchSchema)
  if (error) return error
  const { action, editorNote, ...fields } = data

  /* ---- workflow transitions ---- */
  if (action) {
    if (action === 'submit') {
      if (!isAuthor && !isEditor) return fail('अनुमति छैन।', 403)
      if (article.status === 'published') return fail('प्रकाशित समाचार फेरि पठाउन मिल्दैन।', 409)
      await db.article.update({
        where: { id: article.id },
        data: { status: 'submitted', editorNote: null },
      })
      return ok({ status: 'submitted' })
    }
    if (action === 'retract') {
      if (!isAuthor) return fail('आफ्नै समाचार मात्र फिर्ता लिन मिल्छ।', 403)
      if (article.status === 'published') return fail('प्रकाशित समाचार फिर्ता लिन मिल्दैन — सम्पादकसँग गर्नुहोस्।', 409)
      await db.article.update({ where: { id: article.id }, data: { status: 'draft' } })
      return ok({ status: 'draft' })
    }
    if (action === 'publish' || action === 'decline') {
      if (!isEditor) return fail('प्रकाशन/अस्वीकृति सम्पादकको अधिकार हो।', 403)
      if (action === 'publish') {
        await db.article.update({
          where: { id: article.id },
          data: {
            status: 'published',
            publishedAt: article.publishedAt ?? new Date(),
            editorNote: editorNote ?? null,
          },
        })
        return ok({ status: 'published' })
      }
      await db.article.update({
        where: { id: article.id },
        data: { status: 'declined', editorNote: editorNote ?? null },
      })
      return ok({ status: 'declined' })
    }
  }

  /* ---- content edits ---- */
  const editable = ['draft', 'submitted', 'declined'].includes(article.status)
  if (!editable && !isEditor) {
    return fail('प्रकाशित समाचार सम्पादकले मात्र सच्याउन सक्छन्।', 403)
  }

  let bodyNeJson: string | undefined
  if (fields.bodyNe) {
    const blocks = parseBodyBlocks(fields.bodyNe)
    if (blocks.length === 0 || wordCount(blocks) < 15) {
      return fail('समाचारको मुख्य भाग कम्तीमा १५ शब्दको हुनुपर्छ।', 422)
    }
    bodyNeJson = blocksToJson(blocks)
  }

  await db.article.update({
    where: { id: article.id },
    data: {
      ...(fields.desk ? { desk: fields.desk } : {}),
      ...(fields.titleNe ? { titleNe: fields.titleNe } : {}),
      ...(fields.titleEn !== undefined ? { titleEn: fields.titleEn || null } : {}),
      ...(fields.deckNe ? { deckNe: fields.deckNe } : {}),
      ...(fields.deckEn !== undefined ? { deckEn: fields.deckEn || null } : {}),
      ...(bodyNeJson ? { bodyNe: bodyNeJson } : {}),
      ...(fields.bodyEn !== undefined && fields.bodyEn
        ? { bodyEn: blocksToJson(parseBodyBlocks(fields.bodyEn)) }
        : {}),
      ...(fields.hero !== undefined ? { hero: fields.hero || null } : {}),
      ...(fields.tags ? { tags: JSON.stringify(fields.tags) } : {}),
    },
  })
  return ok({ status: article.status })
}

/** Author may delete own unpublished work; editors may delete anything. */
export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requireJournalist()
  if ('error' in guard) return guard.error
  const me = guard.journalist

  const { slug } = await ctx.params
  const article = await db.article.findUnique({ where: { slug } })
  if (!article) return fail('समाचार भेटिएन।', 404)

  const isAuthor = article.authorId === me.id
  const isEditor = me.role === 'editor'
  if (!isEditor && !(isAuthor && article.status !== 'published')) {
    return fail('मेट्ने अनुमति छैन।', 403)
  }
  await db.article.delete({ where: { id: article.id } })
  return ok({ deleted: true })
}
