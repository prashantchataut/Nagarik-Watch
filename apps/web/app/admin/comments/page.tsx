import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canModerateComments } from '@/lib/admin-roles'
import { listCommentsForModeration, type CommentStatus } from '@/lib/engagement/store'
import { AdminPageHeader, AdminEmptyState } from '@/components/admin/primitives'
import { CommentModerationActions } from '@/components/admin/CommentModerationActions'

export const metadata: Metadata = { title: 'टिप्पणी', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const allowed = new Set<CommentStatus | 'all'>(['pending', 'approved', 'rejected', 'flagged', 'all'])

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireNewsroomSession()
  if (!canModerateComments(session.newsroomRole)) return null
  const requested = (await searchParams).status ?? 'pending'
  const status = allowed.has(requested as CommentStatus | 'all') ? (requested as CommentStatus | 'all') : 'pending'
  const comments = await listCommentsForModeration(status)

  return (
    <div>
      <AdminPageHeader title="टिप्पणी" subtitle="Moderation queue, spam review and reader trust controls" />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Comment status filter">
        {(['pending', 'flagged', 'approved', 'rejected', 'all'] as const).map((value) => (
          <Link key={value} href={value === 'pending' ? '/admin/comments' : `/admin/comments?status=${value}`} aria-current={status === value ? 'page' : undefined} className={status === value ? 'rounded-full bg-brand px-4 py-2 text-meta font-bold text-surface' : 'rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong'}>{value}</Link>
        ))}
      </nav>
      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        {comments.length === 0 ? <AdminEmptyState title="यो queue खाली छ" body="छानिएको अवस्थामा कुनै टिप्पणी छैन।" /> : (
          <table className="min-w-full divide-y divide-rule text-left">
            <thead className="bg-surface text-caption uppercase tracking-wide text-mute"><tr><th className="px-4 py-3">Reader</th><th className="px-4 py-3">Comment</th><th className="px-4 py-3">Article</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-rule">{comments.map((comment) => (
              <tr key={comment.id} className="align-top">
                <td className="px-4 py-3"><p className="font-semibold text-ink">{comment.authorName}</p><p className="text-caption text-mute">{comment.authorEmail || 'Email not supplied'}</p><time className="mt-1 block text-caption text-mute" dateTime={comment.createdAt}>{new Intl.DateTimeFormat('ne-NP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(comment.createdAt))}</time></td>
                <td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-body leading-relaxed text-ink-soft">{comment.bodyNe}</td>
                <td className="px-4 py-3"><Link className="font-semibold text-brand-strong hover:underline" href={`/${comment.articleCategory}/${comment.articleSlug}`} target="_blank">{comment.articleSlug}</Link></td>
                <td className="px-4 py-3 text-meta text-ink-soft">{comment.status}</td>
                <td className="px-4 py-3"><CommentModerationActions commentId={comment.id} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
