import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, COMMUNITY_MANAGER_ROLES } from '@/lib/admin-roles'
import {
  listContactMessages,
  updateContactMessageStatus,
  type ContactMessageStatus,
} from '@/lib/contact-messages'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminCard, AdminEmptyState, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'सम्पर्क सन्देश',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function updateStatus(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? 'unread') as ContactMessageStatus
  if (!['unread', 'in_review', 'resolved'].includes(status)) throw new Error('Invalid status')
  const message = await updateContactMessageStatus(id, status)
  if (!message) throw new Error('Contact message not found')
  await recordAuditEvent({
    session,
    action: 'status_change',
    targetType: 'contact_message',
    targetId: id,
    summary: `Contact message marked ${status}`,
  })
  revalidatePath('/admin/contact')
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ne-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kathmandu',
  }).format(new Date(value))
}

export default async function ContactInboxPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const messages = await listContactMessages()
  const unread = messages.filter((message) => message.status === 'unread').length

  return (
    <div>
      <AdminPageHeader
        subtitle={`${unread} नपढिएका · पाठक सुझाव, सुधार र सामान्य सम्पर्क`}
      />
      {messages.length === 0 ? (
        <AdminEmptyState
          title="कुनै सम्पर्क सन्देश छैन"
          body="पाठकले सार्वजनिक सम्पर्क फारम पठाएपछि सन्देश यहाँ देखिन्छ।"
        />
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <AdminCard key={message.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`admin-status admin-status--${message.status === 'unread' ? 'attention' : message.status === 'resolved' ? 'success' : 'neutral'}`}>
                      {message.status === 'unread' ? 'नपढिएको' : message.status === 'resolved' ? 'समाधान' : 'समीक्षामा'}
                    </span>
                    <time dateTime={message.createdAt} className="text-caption text-mute">{formatDate(message.createdAt)}</time>
                  </div>
                  <h2 className="mt-2 font-display text-h2 text-ink">{message.subject}</h2>
                  <p className="mt-1 text-meta text-ink-soft">
                    {message.name} · <a href={`mailto:${message.email}`} className="text-brand-strong hover:underline">{message.email}</a>
                  </p>
                </div>
                <form action={updateStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={message.id} />
                  <button name="status" value="in_review" className="admin-button admin-button--secondary">समीक्षामा</button>
                  <button name="status" value="resolved" className="admin-button admin-button--primary">समाधान</button>
                  {message.status !== 'unread' ? <button name="status" value="unread" className="admin-button admin-button--ghost">नपढिएको</button> : null}
                </form>
              </div>
              <p className="mt-4 whitespace-pre-line border-t border-rule pt-4 text-body leading-relaxed text-ink" lang={message.locale}>{message.message}</p>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
