import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'विषय',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/** Topics are tags in this CMS; keep URL but send editors to Tags. */
export default async function TopicsPage() {
  await requireNewsroomSession()
  redirect('/admin/tags')
}
