import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader } from '@/components/admin/primitives'
import { PollsManager } from '@/components/admin/PollsManager'

export const metadata: Metadata = {
  title: 'मतदान',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Polls manager. The PollsManager component (client) holds in-memory drafts
 * until the persistence + vote endpoint land. Wrapping it with
 * AdminPageHeader here gives the page the standard Nepali heading and an
 * honest subtitle about the in-memory state.
 */
export default async function PollsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  return (
    <div>
      <AdminPageHeader
        title="मतदान"
        subtitle="दैनिक मतदान सिर्जना र सम्पादन — हालसम्म मेमोरीमा मात्र बचत हुन्छ"
      />
      <PollsManager />
    </div>
  )
}
