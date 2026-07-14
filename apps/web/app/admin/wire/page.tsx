import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader, AdminCard, AdminEmptyState } from '@/components/admin/primitives'
import { WireBrowser } from './WireBrowser'
import { fetchAggregatedFeedWithStatus, INGEST_SOURCES } from '@nagarikwatch/ingest'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'

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
  let items: {
    titleNe: string
    titleEn?: string
    sourceName: string
    sourceUrl: string
    sourcePublishedAt?: string
    retrievedAt: string
    sourceType: string
  }[] = []
  let fetchError: string | null = null
  let providerSummary = ''
  try {
    const result = await fetchAggregatedFeedWithStatus(INGEST_SOURCES, 40)
    items = result.items
    providerSummary = `${result.successfulSources}/${INGEST_SOURCES.length} स्रोत उपलब्ध`
    if (result.successfulSources === 0) {
      fetchError = 'कुनै पनि दर्ता गरिएको RSS स्रोत उपलब्ध भएन।'
    } else if (result.failedSources.length > 0) {
      fetchError = `${result.failedSources.length} स्रोत अस्थायी रूपमा उपलब्ध छैनन्; बाँकी स्रोतका शीर्षक देखाइएका छन्।`
    }
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'RSS fetch failed'
  }
  const payloadCreateUrl = isPayloadCanonical()
    ? `${payloadCollectionAdminUrl('articles')}/create`
    : undefined

  return (
    <div>
      <AdminPageHeader
        title="वायर र RSS"
        subtitle={`रजिस्टर गरिएका RSS फिडका शीर्षक र मूल लिङ्क मात्र। ${providerSummary}`}
      />
      <AdminCard className="mb-5">
        <p className="text-meta text-ink-soft" lang="ne">
          <strong className="text-brand-strong">कॉपीराइट नीति:</strong> यो पृष्ठले शीर्षक र लिङ्क
          मात्र देखाउँछ। स्रोतको मूल पाठ कहिल्यै प्रतिलिपि नगर्नुहोस्। 'समाचार विकास गर्नुहोस्'
          क्लिक गर्दा सम्पादकले मौलिक लेख लेख्नुपर्छ, स्रोत उल्लेख सहित।
        </p>
      </AdminCard>
      {fetchError && (
        <AdminCard className="mb-5 border-breaking/30">
          <p className="text-meta text-breaking" lang="ne">
            {fetchError}
          </p>
          <p className="mt-1 text-caption text-mute" lang="ne">
            यो सूचना provider health मा आधारित छ; Vercel मा स्वतः सफल हुन्छ भन्ने अनुमान गरिएको छैन।
          </p>
        </AdminCard>
      )}
      {items.length === 0 && !fetchError ? (
        <AdminEmptyState title="कुनै वायर आइटम छैन" body="RSS फिडहरू खाली छन् वा लोड हुन सकेनन्।" />
      ) : (
        <WireBrowser items={items} payloadCreateUrl={payloadCreateUrl} />
      )}
    </div>
  )
}
