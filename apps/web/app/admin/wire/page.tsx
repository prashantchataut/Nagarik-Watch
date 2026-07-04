import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader, AdminCard, AdminEmptyState } from '@/components/admin/primitives'
import { WireBrowser } from './WireBrowser'
import { fetchAggregatedFeed, INGEST_SOURCES } from '@nagarikwatch/ingest'

export const metadata: Metadata = { title: 'Wire & RSS', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'
export const revalidate = 300

/**
 * Wire/RSS aggregator admin page. Editors browse the latest headlines from
 * registered RSS feeds (title + link only — never body text, per copyright
 * policy). Clicking "Develop story" opens the article editor pre-filled with
 * the source attribution (sourceName + sourceUrl) so the editor writes an
 * ORIGINAL article informed by the wire lead, not a copy.
 *
 * This is the legitimate editorial workflow: read multiple sources, write
 * your own original article, cite the source. The published article is
 * original Nagarik Watch content, not reproduced wire text.
 */
export default async function WirePage() {
  await requireNewsroomSession()
  let items: { titleNe: string; titleEn?: string; sourceName: string; sourceUrl: string; sourcePublishedAt: string; sourceType: string }[] = []
  let fetchError: string | null = null
  try {
    items = await fetchAggregatedFeed(INGEST_SOURCES, 40)
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'RSS fetch failed'
  }

  return (
    <div>
      <AdminPageHeader
        title="वायर र RSS"
        subtitle="रजिस्टर गरिएका RSS फिडबाट शीर्षकहरू ब्राउज गर्नुहोस्। 'समाचार विकास गर्नुहोस्' मा क्लिक गरेर मौलिक लेख लेख्न सुरु गर्नुहोस्।"
      />
      <AdminCard className="mb-5">
        <p className="text-meta text-ink-soft" lang="ne">
          <strong className="text-brand-strong">कॉपीराइट नीति:</strong> यो पृष्ठले शीर्षक र लिङ्क मात्र देखाउँछ। स्रोतको मूल पाठ कहिल्यै प्रतिलिपि नगर्नुहोस्। 'समाचार विकास गर्नुहोस्' क्लिक गर्दा सम्पादकले मौलिक लेख लेख्नुपर्छ, स्रोत उल्लेख सहित।
        </p>
      </AdminCard>
      {fetchError && (
        <AdminCard className="mb-5 border-breaking/30">
          <p className="text-meta text-breaking" lang="ne">RSS फिड लोड गर्न सकिएन: {fetchError}</p>
          <p className="mt-1 text-caption text-mute" lang="ne">सर्भरमा इन्टरनेट पहुँच आवश्यक छ। Vercel मा स्वतः काम गर्छ।</p>
        </AdminCard>
      )}
      {items.length === 0 && !fetchError ? (
        <AdminEmptyState title="कुनै वायर आइटम छैन" body="RSS फिडहरू खाली छन् वा लोड हुन सकेनन्।" />
      ) : (
        <WireBrowser items={items} />
      )}
    </div>
  )
}
