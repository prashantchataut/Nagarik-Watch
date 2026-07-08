import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { PROVINCES } from '@/lib/site'
import { AdminPageHeader, AdminButton } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'प्रदेश',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Provinces. Nepal's seven provinces (lib/site.ts). The article-count
 * column is a best-effort match against the article's optional `province`
 * field — the seed articles do not yet carry that field for every story,
 * so the count is honest (it may read 0). The intent is to surface the
 * future province-editor workflow, not to fake coverage numbers.
 */
export default async function ProvincesPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const storiesResult = await getStories({ locale: 'ne', perPage: 1000 })
  // Count by the article's province field. Falls back to "—" when no article
  // declares a province, so editors see the real gap.
  const countsByProvince = new Map<string, number>()
  for (const s of storiesResult.items) {
    const prov = 'province' in s ? (s as { province?: string }).province : undefined
    if (!prov) continue
    countsByProvince.set(prov, (countsByProvince.get(prov) ?? 0) + 1)
  }

  return (
    <div>
      <AdminPageHeader
        title="प्रदेश"
        subtitle="नेपालका सात प्रदेश — प्रदेश सम्पादक कार्यप्रवाहका लागि आधार"
        action={
          <AdminButton
            disabled
            title="प्रदेश सम्पादक नियुक्तिका लागि प्रयोगकर्ता व्यवस्थापन आवश्यक छ"
          >
            + प्रदेश सम्पादक
          </AdminButton>
        }
      />

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">
                प्रदेश (ने)
              </th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="ne">
                प्रदेश (En)
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                स्लग
              </th>
              <th className="px-4 py-3 font-semibold text-right" lang="ne">
                समाचार
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                पृष्ठ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {PROVINCES.map((p) => {
              const count = countsByProvince.get(p.slug) ?? 0
              return (
                <tr key={p.slug} className="hover:bg-brand-tint/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/province/${p.slug}`}
                      className="font-display font-semibold text-ink hover:text-brand-strong"
                      lang="ne"
                    >
                      {p.nameNe}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-meta text-ink-soft sm:table-cell" lang="en">
                    {p.nameEn}
                  </td>
                  <td className="px-4 py-3">
                    <code
                      className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft"
                      lang="en"
                    >
                      {p.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right font-display text-h2 text-ink">
                    {count > 0 ? count : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/province/${p.slug}`}
                      className="text-meta font-semibold text-brand hover:text-brand-strong"
                      lang="ne"
                    >
                      हेर्नुहोस् →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-caption text-mute" lang="ne">
        समाचार संख्या प्रति लेखको{' '}
        <code className="font-mono text-ink-soft" lang="en">
          province
        </code>{' '}
        फाँटबाट गणना हुन्छ। सबै लेखमा यो फाँट भरिएको हुँदैन, त्यसैले केही प्रदेशमा «—» देखिन सक्छ।
      </p>
    </div>
  )
}
