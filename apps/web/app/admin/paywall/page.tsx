import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, MEMBERSHIP_MANAGER_ROLES } from '@/lib/admin-roles'
import { listManualSubscriptions, setManualSubscription } from '@/lib/paywall-admin'
import { membershipMode } from '@/lib/membership'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'सदस्यता / Paywall',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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
      <AdminPageHeader title="सदस्यता / Paywall" subtitle="Manual subscriber override and premium access controls" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <AdminCard className="border-l-4 border-l-brand">
          <p className="text-meta text-ink-soft" lang="ne">Membership mode: <code className="font-mono text-ink" lang="en">{mode}</code>. Payment provider नहुँदा manual override प्रयोग हुन्छ।</p>
          <form action={saveSubscription} className="mt-5 grid gap-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Reader email<input name="email" type="email" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-caption font-semibold text-ink-soft">Status<select name="status" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink"><option value="active">Active</option><option value="trialing">Trialing</option><option value="comped">Comped</option><option value="expired">Expired</option></select></label>
              <label className="grid gap-1 text-caption font-semibold text-ink-soft">Plan<input name="plan" defaultValue="manual" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            </div>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Expires at<input name="expiresAt" type="datetime-local" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Internal note<textarea name="note" rows={3} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" /></label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">Save subscriber</button>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Subscribers</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left">
              <thead className="bg-surface text-caption uppercase tracking-wide text-mute"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Expires</th></tr></thead>
              <tbody className="divide-y divide-rule">
                {subscriptions.map((item) => (<tr key={item.email}><td className="px-4 py-3 text-meta text-ink">{item.email}</td><td className="px-4 py-3"><span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-bold text-brand-strong">{item.status}</span></td><td className="px-4 py-3 text-meta text-ink-soft">{item.plan}</td><td className="px-4 py-3 text-caption text-mute">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '—'}</td></tr>))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
