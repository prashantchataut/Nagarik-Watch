import type { ReaderSession } from '@/lib/auth/session'
import { isManualSubscriberEmail } from '@/lib/paywall-admin'
import { getPaymentAdapterState } from '@/lib/payments/adapter'

const NEWSROOM_PREMIUM_ROLES = new Set([
  'viewer',
  'reviewer',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'seo_manager',
  'moderator',
  'ad_manager',
  'analyst',
  'publisher',
  'admin',
  'super_admin',
])

function paidMemberEmails(): Set<string> {
  return new Set(
    (process.env.PAID_MEMBER_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function hasPremiumRoleOrEnvOverride(session: ReaderSession | null): boolean {
  if (!session) return false
  if (session.role === 'subscriber' || session.role === 'member' || session.role === 'premium_reader') {
    return true
  }
  if (NEWSROOM_PREMIUM_ROLES.has(session.role)) return true
  return paidMemberEmails().has(session.email.toLowerCase())
}

export async function isPremiumSubscriber(session: ReaderSession | null): Promise<boolean> {
  if (!session) return false
  if (hasPremiumRoleOrEnvOverride(session)) return true
  return isManualSubscriberEmail(session.email)
}

export function membershipMode(): 'manual' | 'payment' {
  return getPaymentAdapterState().ready ? 'payment' : 'manual'
}
