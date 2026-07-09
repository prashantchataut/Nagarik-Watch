import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { createPoll, listPolls } from '@/lib/polls-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'मतदान', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function savePoll(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  const poll = await createPoll({ question: formData.get('question'), options: formData.get('options'), status: formData.get('status') })
  if (poll) await recordAuditEvent({ session, action: 'create', targetType: 'poll', targetId: poll.id, summary: `Poll created: ${poll.question}` })
  revalidatePath('/admin/polls')
}

export default async function PollsPage() {
  await requireNewsroomSession()
  const polls = await listPolls()
  return (
    <div>
      <AdminPageHeader title="मतदान" subtitle="Reader poll creation and publication status" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard><h2 className="font-display text-h2 text-ink">New poll</h2><form action={savePoll} className="mt-4 grid gap-3"><label className="grid gap-1 text-caption font-semibold text-ink-soft">Question<input name="question" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label><label className="grid gap-1 text-caption font-semibold text-ink-soft">Options, one per line<textarea name="options" required rows={6} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" /></label><label className="grid gap-1 text-caption font-semibold text-ink-soft">Status<select name="status" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink"><option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option></select></label><button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">Save poll</button></form></AdminCard>
        <AdminCard><h2 className="font-display text-h2 text-ink">Polls</h2><div className="mt-4 grid gap-3">{polls.map((poll) => <article key={poll.id} className="rounded-lg border border-rule bg-surface p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-h3 text-ink">{poll.question}</h3><span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-bold text-brand-strong">{poll.status}</span></div><ul className="mt-3 grid gap-1 text-meta text-ink-soft">{poll.options.map((option) => <li key={option}>• {option}</li>)}</ul></article>)}</div></AdminCard>
      </div>
    </div>
  )
}
