import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'

export const metadata: Metadata = {
  title: 'Wire retired',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/**
 * Competitor RSS monitoring is intentionally retired. Nagarik Watch's
 * newsroom works from its own assignments, reporting, and CMS inventory.
 */
export default async function WirePage() {
  await requireNewsroomSession()
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('articles'))
  redirect('/admin/articles')
}
