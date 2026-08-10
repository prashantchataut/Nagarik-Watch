import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canModerateComments } from '@/lib/admin-roles'
import { listCommentsForModeration, type CommentStatus } from '@/lib/engagement/store'
import { analyzeSentiment } from '@/lib/nlp/sentiment'
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminFilterLink,
  AdminCard,
  AdminTable,
} from '@/components/admin/primitives'
import { CommentModerationActions } from '@/components/admin/CommentModerationActions'

export const metadata: Metadata = { title: 'टिप्पणी', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const allowed = new Set<CommentStatus | 'all'>([
  'pending',
  'approved',
  'rejected',
  'flagged',
  'all',
])

function commentStatusTone(status: CommentStatus): 'attention' | 'success' | 'danger' | 'neutral' {
  if (status === 'pending' || status === 'flagged') return 'attention'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'neutral'
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  if (!canModerateComments(session.newsroomRole)) {
    return (
      <div>
        <AdminPageHeader subtitle="टिप्पणी मोडरेशन" />
        <AdminEmptyState
          title="अनुमति छैन"
          body="यो भूमिकाबाट टिप्पणी मोडरेशन गर्न मिल्दैन। सम्पादक वा मोडरेटर खाता चाहिन्छ।"
        />
      </div>
    )
  }
  const requested = (await searchParams).status ?? 'pending'
  const status = allowed.has(requested as CommentStatus | 'all')
    ? (requested as CommentStatus | 'all')
    : 'pending'
  const comments = await listCommentsForModeration(status)

  return (
    <div>
      <AdminPageHeader subtitle="Moderation queue, spam review and reader trust controls" />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Comment status filter">
        {(['pending', 'flagged', 'approved', 'rejected', 'all'] as const).map((value) => (
          <AdminFilterLink
            key={value}
            href={value === 'pending' ? '/admin/comments' : `/admin/comments?status=${value}`}
            active={status === value}
          >
            {value === 'pending'
              ? 'पेन्डिङ'
              : value === 'flagged'
                ? 'फ्ल्याग'
                : value === 'approved'
                  ? 'स्वीकृत'
                  : value === 'rejected'
                    ? 'अस्वीकृत'
                    : 'सबै'}
          </AdminFilterLink>
        ))}
      </nav>
      <AdminCard className="overflow-hidden !p-0">
        {comments.length === 0 ? (
          <AdminEmptyState title="यो queue खाली छ" body="छानिएको अवस्थामा कुनै टिप्पणी छैन।" />
        ) : (
          <AdminTable minWidth="48rem">
            <thead>
              <tr>
                <th>Reader</th>
                <th>Comment</th>
                <th>Article</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="align-top">
                  <td>
                    <p className="font-semibold text-ink">{comment.authorName}</p>
                    <p className="text-caption text-mute">
                      {comment.authorEmail || 'Email not supplied'}
                    </p>
                    <time
                      className="mt-1 block text-caption text-mute"
                      dateTime={comment.createdAt}
                    >
                      {new Intl.DateTimeFormat('ne-NP', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(comment.createdAt))}
                    </time>
                  </td>
                  <td className="max-w-xl whitespace-pre-wrap text-body leading-relaxed text-ink-soft">
                    {comment.bodyNe}
                  </td>
                  <td>
                    <Link
                      className="font-semibold text-brand-strong hover:underline"
                      href={`/${comment.articleCategory}/${comment.articleSlug}`}
                      target="_blank"
                    >
                      {comment.articleSlug}
                    </Link>
                  </td>
                  <td className="text-caption text-ink-soft">
                    <p>tox {(comment.toxicityScore ?? 0).toFixed(2)}</p>
                    <p>spam {(comment.spamScore ?? 0).toFixed(2)}</p>
                    <p>trust {(comment.reputationUsed ?? 0.5).toFixed(2)}</p>
                    {(() => {
                      const sentiment = analyzeSentiment(comment.bodyNe)
                      return (
                        <p className="mt-1">
                          sentiment {sentiment.label} ({sentiment.score.toFixed(2)})
                        </p>
                      )
                    })()}
                    {comment.moderationFlags?.length ? (
                      <p className="mt-1 text-mute">{comment.moderationFlags.join(', ')}</p>
                    ) : (
                      <p className="mt-1 text-mute">{comment.moderationVerdict || 'scored'}</p>
                    )}
                  </td>
                  <td>
                    <span
                      className={`admin-status admin-status--${commentStatusTone(comment.status)}`}
                    >
                      {comment.status}
                    </span>
                  </td>
                  <td>
                    <CommentModerationActions commentId={comment.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </div>
  )
}
