import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'

export const metadata: Metadata = {
  title: 'विषय',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/** Topics are tags in this CMS; keep URL but send editors to Tags. */
export default async function TopicsPage() {
  await requireNewsroomSession()
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('tags'))
  redirect('/admin/tags')
}
