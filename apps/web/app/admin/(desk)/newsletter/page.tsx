import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, NEWSLETTER_MANAGER_ROLES } from '@/lib/admin-roles'
import {
  createNewsletterIssue,
  listNewsletterIssues,
  listNewsletterSubscribers,
  processNewsletterQueue,
  upsertNewsletterSubscriber,
} from '@/lib/newsletter-admin'
import { getEmailProviderState } from '@/lib/email-provider'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminCallout,
  AdminMetric,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'न्युजलेटर',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

function issueStatusTone(status: string): 'success' | 'attention' | 'neutral' {
  if (status === 'sent' || status === 'delivered') return 'success'
  if (status === 'queued' || status === 'sending') return 'attention'
  return 'neutral'
}

async function saveIssue(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, NEWSLETTER_MANAGER_ROLES)
  const issue = await createNewsletterIssue({
    subject: formData.get('subject'),
    body: formData.get('body'),
    sendNow: formData.get('sendNow') === 'on',
  })
  await recordAuditEvent({ session, action: 'newsletter_queue', targetType: 'newsletter', targetId: issue.id, summary: `Newsletter ${issue.status}: ${issue.subject}` })
  revalidatePath('/admin/newsletter')
}

async function processQueue() {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, NEWSLETTER_MANAGER_ROLES)
  const result = await processNewsletterQueue(1)
  await recordAuditEvent({
    session,
    action: 'newsletter_process',
    targetType: 'newsletter',
    targetId: 'queue',
    summary: result.detail,
  })
  revalidatePath('/admin/newsletter')
}

async function addSubscriber(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, NEWSLETTER_MANAGER_ROLES)
  const subscriber = await upsertNewsletterSubscriber({ email: formData.get('email'), source: 'admin' })
  if (subscriber) {
    await recordAuditEvent({ session, action: 'create', targetType: 'newsletter_subscriber', targetId: subscriber.email, summary: `Subscriber added: ${subscriber.email}` })
  }
  revalidatePath('/admin/newsletter')
}

export default async function NewsletterPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, NEWSLETTER_MANAGER_ROLES)
  const [issues, subscribers] = await Promise.all([listNewsletterIssues(), listNewsletterSubscribers()])
  const provider = getEmailProviderState()

  return (
    <div>
      <AdminPageHeader subtitle="Draft, queue and subscriber management" />
      <section className="admin-metric-grid mb-5" aria-label="Newsletter metrics">
        <AdminMetric value={subscribers.length} label="Subscribers" />
        <AdminMetric value={issues.length} label="Issues" />
        <AdminMetric value={provider.ready ? provider.provider : 'Not configured'} label="Provider" />
      </section>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.3fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">Issue लेख्नुहोस्</h2>
          <form action={saveIssue} className="mt-4 grid gap-3">
            <AdminInput label="Subject" name="subject" required lang="en" />
            <AdminCallout tone="neutral">
              <p className="text-caption text-mute">Audience: confirmed newsletter subscribers. Member and newsroom segments are disabled until their identity data is connected.</p>
            </AdminCallout>
            <AdminTextarea label="Body" name="body" rows={8} required lang="en" />
            <label className="flex items-center gap-2 text-meta font-semibold text-ink-soft">
              <input name="sendNow" type="checkbox" className="size-4 accent-brand" /> Add to delivery queue
            </label>
            <AdminButton type="submit">Save newsletter</AdminButton>
          </form>
          <form action={processQueue} className="mt-3">
            <AdminButton type="submit" variant="secondary" disabled={!provider.ready} className="w-full">
              Process next queued issue
            </AdminButton>
            <p className="mt-2 text-caption text-mute">{provider.detail}</p>
          </form>
          <form action={addSubscriber} className="mt-6 grid gap-2 rounded-lg border border-rule bg-surface p-3">
            <AdminInput label="Add subscriber" name="email" type="email" required lang="en" />
            <AdminButton type="submit" variant="secondary">Add email</AdminButton>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">Queue</h2>
          <div className="mt-4 grid gap-3">
            {issues.length ? issues.map((issue) => (
              <article key={issue.id} className="rounded-lg border border-rule bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-display text-h3 text-ink">{issue.subject}</h3><p className="mt-1 text-caption text-mute">{new Date(issue.createdAt).toLocaleString()}</p></div>
                  <span className={`admin-status admin-status--${issueStatusTone(issue.status)}`}>{issue.status}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-meta text-ink-soft">{issue.body}</p>
                {issue.providerMessage ? <p className="mt-2 text-caption text-mute">{issue.providerMessage}</p> : null}
              </article>
            )) : <p className="rounded-lg border border-dashed border-rule p-6 text-center text-meta text-mute">No newsletter issues yet.</p>}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
