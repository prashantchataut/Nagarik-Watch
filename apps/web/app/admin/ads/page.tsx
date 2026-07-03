import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  AdminPageHeader,
  AdminCard,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विज्ञापन',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Ad manager. Documents the five ad placements the homepage / article
 * templates reserve (header leaderboard, in-feed card, two in-article
 * slots, sidebar, footer). Each placement has a fixed key + size + status
 * row; status is active only when NEXT_PUBLIC_ADSENSE_CLIENT is set.
 *
 * No fake campaign data is rendered — the table is the contract the ad
 * slot component (apps/web/components/ads/AdSlot) reads from.
 */
export default async function AdsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const adsenseConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT)

  const placements = [
    {
      key: 'header-leaderboard',
      labelNe: 'हेडर लिडरबोर्ड',
      size: '728×90 / 970×90',
      locationNe: 'गृहपृष्ठ र सबै विभागको सबैभन्दा माथि',
    },
    {
      key: 'in-feed',
      labelNe: 'इन-फिड',
      size: 'प्रवाह कार्ड',
      locationNe: 'समाचार सूचीको प्रवाहमा हरेक ६ वटा कार्डपछि',
    },
    {
      key: 'in-article-1',
      labelNe: 'लेख भित्र १',
      size: '300×250',
      locationNe: 'लेखको मूल सामग्रीमा पहिलो तेस्रो अनुच्छेदपछि',
    },
    {
      key: 'in-article-2',
      labelNe: 'लेख भित्र २',
      size: '336×280',
      locationNe: 'लेखको मध्य-तल्लो भागमा',
    },
    {
      key: 'sidebar',
      labelNe: 'साइडबार',
      size: '300×600 / 300×250',
      locationNe: 'लेख पृष्ठको दायाँ स्तम्भ',
    },
    {
      key: 'footer',
      labelNe: 'फुटर',
      size: '970×90',
      locationNe: 'सबै पृष्ठको फुटरमाथि',
    },
  ] as const

  return (
    <div>
      <AdminPageHeader
        title="विज्ञापन"
        subtitle="विज्ञापन स्लट व्यवस्थापन — AdSense कन्फिगरेसन र प्लेसमेन्ट"
      />

      <AdminCard className="mb-5 border-l-4 border-l-brand">
        <p className="text-body text-ink" lang="ne">
          विज्ञापन सक्रिय गर्न{' '}
          <code className="font-mono text-ink-soft" lang="en">
            NEXT_PUBLIC_ADSENSE_CLIENT
          </code>{' '}
          env चर कन्फिगर गर्नुहोस्। हाल{' '}
          <span
            className={`rounded-full px-2 py-0.5 text-caption font-semibold ${
              adsenseConfigured
                ? 'bg-brand-tint text-brand-strong'
                : 'border border-rule text-mute'
            }`}
            lang="ne"
          >
            {adsenseConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
          </span>
          । कन्फिगर नभएसम्म सबै प्लेसमेन्ट निष्क्रिय रहन्छ र पाठकले विज्ञापन देख्दैनन्।
        </p>
      </AdminCard>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">प्लेसमेन्ट</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्लट कुञ्जी</th>
              <th className="px-4 py-3 font-semibold" lang="ne">साइज</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">स्थान</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {placements.map((p) => (
              <tr key={p.key} className="hover:bg-brand-tint/30">
                <td className="px-4 py-3 align-top font-display font-semibold text-ink" lang="ne">
                  {p.labelNe}
                </td>
                <td className="px-4 py-3 align-top">
                  <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft" lang="en">
                    {p.key}
                  </code>
                </td>
                <td className="px-4 py-3 align-top text-meta text-ink-soft" lang="en">
                  {p.size}
                </td>
                <td className="hidden px-4 py-3 align-top text-meta text-ink-soft md:table-cell" lang="ne">
                  {p.locationNe}
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                      adsenseConfigured
                        ? 'bg-brand-tint text-brand-strong'
                        : 'border border-rule text-mute'
                    }`}
                    lang="ne"
                  >
                    {adsenseConfigured ? 'सक्रिय' : 'निष्क्रिय'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-caption text-mute" lang="ne">
        प्रत्यक्ष बिक्री र प्रायोजित सामग्रीका लागि छुट्टै SponsoredContent कलेक्सन (Payload)
        जोडिनेछ — त्यो यहाँ देखिनेछैन।
      </p>
    </div>
  )
}
