import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'
import { AD_PLACEMENTS, getAdMode, isNetworkAdsReady } from '@/lib/ads'

export const metadata: Metadata = {
  title: 'विज्ञापन',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Commercial inventory reference. This page is intentionally operational: the
 * public ad shell, sales deck and article editor all use the same placement
 * registry so names cannot drift between design, newsroom and campaign setup.
 */
export default async function AdsPage() {
  const session = await requireNewsroomSession()
  void session

  const adMode = getAdMode()
  const networkReady = isNetworkAdsReady()
  const placements = Object.values(AD_PLACEMENTS)
  const grouped = placements.reduce<Record<string, typeof placements>>((acc, placement) => {
    acc[placement.surface] = [...(acc[placement.surface] ?? []), placement]
    return acc
  }, {})

  return (
    <div>
      <AdminPageHeader
        title="विज्ञापन"
        subtitle="public site, article body shorthand, campaign reporting र media kit ले प्रयोग गर्ने एउटै placement registry"
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <AdminCard className="border-l-4 border-l-brand">
          <p className="text-body text-ink" lang="ne">
            हालको delivery mode:{' '}
            <code className="font-mono text-ink-soft" lang="en">
              {adMode}
            </code>
            । स्थिति:{' '}
            <span
              className={`rounded-full px-2 py-0.5 text-caption font-semibold ${
                adMode !== 'network' || networkReady
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
              lang="ne"
            >
              {adMode !== 'network' || networkReady
                ? 'delivery तयार'
                : 'delivery credential प्रतीक्षामा'}
            </span>
          </p>
          <p className="mt-2 text-meta text-ink-soft" lang="ne">
            Public pages ले reserved ad slots देखाउँछन्। Campaign creative जोड्दा layout shift रोक्न
            यही width/height पालना गर्नुहोस्।
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
            Editor shorthand
          </p>
          <p className="mt-2 text-body text-ink-soft" lang="ne">
            लेख body मा manual ad राख्न{' '}
            <code className="font-mono" lang="en">
              [ad:article-inline-1]
            </code>{' '}
            वा registry मा भएको कुनै key प्रयोग गर्नुहोस्। गलत key भए article-inline-1 fallback
            हुन्छ।
          </p>
        </AdminCard>
      </div>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([surface, items]) => (
          <section
            key={surface}
            className="overflow-hidden rounded-lg border border-rule bg-surface-raised"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface px-4 py-3">
              <h2 className="font-display text-h2 text-ink" lang="en">
                {surface}
              </h2>
              <span
                className="rounded-full border border-rule px-2.5 py-1 text-caption font-semibold text-ink-soft"
                lang="en"
              >
                {items.length} slot{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-rule text-left">
                <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
                  <tr>
                    <th className="px-4 py-3 font-semibold" lang="ne">
                      लेबल
                    </th>
                    <th className="px-4 py-3 font-semibold" lang="ne">
                      Key
                    </th>
                    <th className="px-4 py-3 font-semibold" lang="ne">
                      साइज
                    </th>
                    <th className="px-4 py-3 font-semibold" lang="ne">
                      स्थान
                    </th>
                    <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">
                      विवरण
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {items.map((p) => (
                    <tr key={p.key} className="hover:bg-brand-tint/30">
                      <td
                        className="px-4 py-3 align-top font-display font-semibold text-ink"
                        lang="en"
                      >
                        {p.label}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <code
                          className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft"
                          lang="en"
                        >
                          {p.key}
                        </code>
                      </td>
                      <td className="px-4 py-3 align-top text-meta text-ink-soft" lang="en">
                        {p.width}×{p.height}
                      </td>
                      <td className="px-4 py-3 align-top text-meta text-ink-soft" lang="en">
                        {p.position}
                      </td>
                      <td
                        className="hidden px-4 py-3 align-top text-meta text-ink-soft md:table-cell"
                        lang="ne"
                      >
                        {p.descriptionNe}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-4 text-caption text-mute" lang="ne">
        Impression/click validation{' '}
        <code className="font-mono" lang="en">
          /api/ads/event
        </code>{' '}
        मा हुन्छ। Reporting जोड्दा यही event shape analytics sink मा पठाउनुहोस्।
      </p>
    </div>
  )
}
