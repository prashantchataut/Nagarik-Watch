import type { ReaderSession } from '@/lib/auth/session'
import { isManualSubscriberEmail } from '@/lib/paywall-admin'
import { getPaymentAdapterState } from '@/lib/payments/adapter'
import { isPaidSubscriberEmail } from '@/lib/payments/entitlements'

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
  if (
    session.role === 'subscriber' ||
    session.role === 'member' ||
    session.role === 'premium_reader'
  ) {
    return true
  }
  if (NEWSROOM_PREMIUM_ROLES.has(session.role)) return true
  return paidMemberEmails().has(session.email.toLowerCase())
}

export async function isPremiumSubscriber(session: ReaderSession | null): Promise<boolean> {
  if (!session) return false
  if (hasPremiumRoleOrEnvOverride(session)) return true
  if (await isManualSubscriberEmail(session.email)) return true
  if (!getPaymentAdapterState().ready) return false
  return isPaidSubscriberEmail(session.email).catch((error) => {
    console.error('[membership] paid entitlement lookup failed', {
      userId: session.userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  })
}

export function membershipMode(): 'manual' | 'payment' {
  return getPaymentAdapterState().ready ? 'payment' : 'manual'
}

/**
 * Option A (2026-07-19): public site is free-to-read + ads.
 * Membership / paywall / meter UI stay dormant until this flag is explicitly enabled.
 * Admin paywall tooling and payment adapters may still exist for future use.
 */
export function isPublicMembershipEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC === 'true'
}
