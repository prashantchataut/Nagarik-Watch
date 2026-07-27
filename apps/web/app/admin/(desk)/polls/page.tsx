import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, COMMUNITY_MANAGER_ROLES } from '@/lib/admin-roles'
import { createPoll, listPolls } from '@/lib/polls-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, StatusBadge } from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'मतदान', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function savePoll(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const poll = await createPoll({ question: formData.get('question'), options: formData.get('options'), status: formData.get('status') })
  if (poll) await recordAuditEvent({ session, action: 'create', targetType: 'poll', targetId: poll.id, summary: `Poll created: ${poll.question}` })
  revalidatePath('/admin/polls')
}

export default async function PollsPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const polls = await listPolls()
  return (
    <div>
      <AdminPageHeader subtitle="Reader poll creation and publication status" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">New poll</h2>
          <form action={savePoll} className="mt-4 grid gap-3">
            <AdminInput label="Question" name="question" required lang="en" />
            <AdminTextarea label="Options, one per line" name="options" required rows={6} lang="en" />
            <AdminSelect
              label="Status"
              name="status"
              lang="en"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <AdminButton type="submit">Save poll</AdminButton>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Polls</h2>
          <div className="mt-4 grid gap-3">
            {polls.map((poll) => (
              <article key={poll.id} className="rounded-lg border border-rule bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-h3 text-ink">{poll.question}</h3>
                  <StatusBadge status={poll.status === 'active' ? 'published' : poll.status === 'closed' ? 'archived' : 'draft'} />
                </div>
                <ul className="mt-3 grid gap-1 text-meta text-ink-soft">
                  {poll.options.map((option) => (
                    <li key={option}>• {option}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
