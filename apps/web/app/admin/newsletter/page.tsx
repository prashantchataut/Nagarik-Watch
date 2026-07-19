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
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'न्युजलेटर',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <AdminCard><p className="text-caption uppercase tracking-wide text-mute">Subscribers</p><p className="font-display text-h1 text-ink">{subscribers.length}</p></AdminCard>
        <AdminCard><p className="text-caption uppercase tracking-wide text-mute">Issues</p><p className="font-display text-h1 text-ink">{issues.length}</p></AdminCard>
        <AdminCard><p className="text-caption uppercase tracking-wide text-mute">Provider</p><p className="font-display text-h2 text-ink">{provider.ready ? provider.provider : 'Not configured'}</p></AdminCard>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.3fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">Issue लेख्नुहोस्</h2>
          <form action={saveIssue} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Subject<input name="subject" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <p className="rounded-md border border-rule bg-surface-raised px-3 py-2 text-caption text-mute">Audience: confirmed newsletter subscribers. Member and newsroom segments are disabled until their identity data is connected.</p>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Body<textarea name="body" rows={8} required className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" /></label>
            <label className="flex items-center gap-2 text-meta font-semibold text-ink-soft"><input name="sendNow" type="checkbox" /> Add to delivery queue</label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">Save newsletter</button>
          </form>
          <form action={processQueue} className="mt-3">
            <button disabled={!provider.ready} className="w-full rounded-md border border-brand px-3 py-2 text-caption font-bold text-brand-strong hover:bg-brand-tint disabled:cursor-not-allowed disabled:border-rule disabled:text-mute">Process next queued issue</button>
            <p className="mt-2 text-caption text-mute">{provider.detail}</p>
          </form>
          <form action={addSubscriber} className="mt-6 grid gap-2 rounded-lg border border-rule bg-surface p-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Add subscriber<input name="email" type="email" required className="h-10 rounded-md border border-rule bg-surface-raised px-3 text-body text-ink" /></label>
            <button className="rounded-md border border-rule px-3 py-2 text-caption font-bold text-ink-soft hover:border-brand hover:text-brand-strong">Add email</button>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">Queue</h2>
          <div className="mt-4 grid gap-3">
            {issues.length ? issues.map((issue) => (
              <article key={issue.id} className="rounded-lg border border-rule bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-display text-h3 text-ink">{issue.subject}</h3><p className="mt-1 text-caption text-mute">{new Date(issue.createdAt).toLocaleString()}</p></div>
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-bold text-brand-strong">{issue.status}</span>
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
