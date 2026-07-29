import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, COMMUNITY_MANAGER_ROLES } from '@/lib/admin-roles'
import { createPoll, listPolls, updatePollStatus } from '@/lib/polls-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  StatusBadge,
  AdminEmptyState,
} from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'मतदान', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function savePoll(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const poll = await createPoll({
    question: formData.get('question'),
    options: formData.get('options'),
    status: formData.get('status'),
  })
  if (poll) {
    await recordAuditEvent({
      session,
      action: 'create',
      targetType: 'poll',
      targetId: poll.id,
      summary: `Poll created: ${poll.question}`,
    })
  }
  revalidatePath('/admin/polls')
}

async function setPollStatus(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const pollId = String(formData.get('pollId') ?? '')
  const nextStatus = String(formData.get('status') ?? '')
  const poll = await updatePollStatus(pollId, nextStatus)
  if (poll) {
    await recordAuditEvent({
      session,
      action: 'update',
      targetType: 'poll',
      targetId: poll.id,
      summary: `Poll ${poll.status}: ${poll.question}`,
    })
  }
  revalidatePath('/admin/polls')
}

export default async function PollsPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const polls = await listPolls()
  return (
    <div>
      <AdminPageHeader subtitle="पाठक मतदान बनाउनुहोस्, सक्रिय गर्नुहोस् वा बन्द गर्नुहोस्" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">
            नयाँ मतदान
          </h2>
          <form action={savePoll} className="mt-4 grid gap-3">
            <AdminInput label="प्रश्न" name="question" required lang="ne" />
            <AdminTextarea
              label="विकल्प (प्रति लाइन एक)"
              name="options"
              required
              rows={6}
              lang="ne"
              hint="कम्तीमा दुई विकल्प। सार्वजनिक पृष्ठमा placeholder/test प्रतिलिपि देखाइँदैन।"
            />
            <AdminSelect
              label="स्थिति"
              name="status"
              lang="ne"
              options={[
                { value: 'draft', label: 'ड्राफ्ट' },
                { value: 'active', label: 'सक्रिय' },
                { value: 'closed', label: 'बन्द' },
              ]}
            />
            <AdminButton type="submit">मतदान सुरक्षित</AdminButton>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">
            मतदान सूची
          </h2>
          {polls.length === 0 ? (
            <AdminEmptyState
              title="अहिले कुनै मतदान छैन"
              body="बायाँ फारमबाट प्रश्न र विकल्प थप्नुहोस्। सक्रिय मतदान मात्र गृहपृष्ठमा देखिन्छ।"
            />
          ) : (
            <div className="mt-4 grid gap-3">
              {polls.map((poll) => (
                <article key={poll.id} className="rounded-lg border border-rule bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-h3 text-ink" lang="ne">
                      {poll.question}
                    </h3>
                    <StatusBadge
                      status={
                        poll.status === 'active'
                          ? 'published'
                          : poll.status === 'closed'
                            ? 'archived'
                            : 'draft'
                      }
                    />
                  </div>
                  <ul className="mt-3 grid gap-1 text-meta text-ink-soft" lang="ne">
                    {poll.options.map((option) => (
                      <li key={option}>• {option}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {poll.status !== 'active' ? (
                      <form action={setPollStatus}>
                        <input type="hidden" name="pollId" value={poll.id} />
                        <input type="hidden" name="status" value="active" />
                        <AdminButton type="submit" variant="primary" className="!min-h-9 !px-3 !text-caption">
                          सक्रिय गर्नुहोस्
                        </AdminButton>
                      </form>
                    ) : null}
                    {poll.status !== 'draft' ? (
                      <form action={setPollStatus}>
                        <input type="hidden" name="pollId" value={poll.id} />
                        <input type="hidden" name="status" value="draft" />
                        <AdminButton type="submit" variant="secondary" className="!min-h-9 !px-3 !text-caption">
                          ड्राफ्टमा फर्काउनुहोस्
                        </AdminButton>
                      </form>
                    ) : null}
                    {poll.status !== 'closed' ? (
                      <form action={setPollStatus}>
                        <input type="hidden" name="pollId" value={poll.id} />
                        <input type="hidden" name="status" value="closed" />
                        <AdminButton type="submit" variant="ghost" className="!min-h-9 !px-3 !text-caption">
                          बन्द गर्नुहोस्
                        </AdminButton>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
