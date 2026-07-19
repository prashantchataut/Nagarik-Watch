import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, MEMBERSHIP_MANAGER_ROLES } from '@/lib/admin-roles'
import { listManualSubscriptions, setManualSubscription } from '@/lib/paywall-admin'
import { membershipMode } from '@/lib/membership'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect, AdminTable } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'सदस्यता / Paywall',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function subscriptionStatusTone(status: string): 'success' | 'attention' | 'neutral' | 'danger' {
  if (status === 'active' || status === 'trialing' || status === 'comped') return 'success'
  if (status === 'expired') return 'danger'
  return 'neutral'
}

async function saveSubscription(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEMBERSHIP_MANAGER_ROLES)
  const subscription = await setManualSubscription({
    email: formData.get('email'),
    status: formData.get('status'),
    plan: formData.get('plan'),
    note: formData.get('note'),
    expiresAt: formData.get('expiresAt'),
  })
  if (subscription) {
    await recordAuditEvent({ session, action: 'update', targetType: 'subscription', targetId: subscription.email, summary: `Subscription updated: ${subscription.email}` })
  }
  revalidatePath('/admin/paywall')
}

export default async function PaywallPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEMBERSHIP_MANAGER_ROLES)
  const subscriptions = await listManualSubscriptions()
  const mode = membershipMode()

  return (
    <div>
      <AdminPageHeader subtitle="Manual subscriber override and premium access controls" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <AdminCard>
          <p className="text-meta text-ink-soft" lang="ne">
            Membership mode: <code className="font-mono text-ink" lang="en">{mode}</code>. Payment provider नहुँदा manual override प्रयोग हुन्छ।
          </p>
          <form action={saveSubscription} className="mt-5 grid gap-3">
            <AdminInput label="Reader email" name="email" type="email" required lang="en" />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminSelect
                label="Status"
                name="status"
                lang="en"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'trialing', label: 'Trialing' },
                  { value: 'comped', label: 'Comped' },
                  { value: 'expired', label: 'Expired' },
                ]}
              />
              <AdminInput label="Plan" name="plan" defaultValue="manual" lang="en" />
            </div>
            <AdminInput label="Expires at" name="expiresAt" type="datetime-local" lang="en" />
            <AdminTextarea label="Internal note" name="note" rows={3} lang="en" />
            <AdminButton type="submit">Save subscriber</AdminButton>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Subscribers</h2>
          <div className="mt-4">
            <AdminTable>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((item) => (
                  <tr key={item.email}>
                    <td className="text-meta text-ink">{item.email}</td>
                    <td>
                      <span className={`admin-status admin-status--${subscriptionStatusTone(item.status)}`}>{item.status}</span>
                    </td>
                    <td className="text-meta text-ink-soft">{item.plan}</td>
                    <td className="text-caption text-mute">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
