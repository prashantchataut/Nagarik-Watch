import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { PROVINCES } from '@/lib/site'
import { AdminPageHeader, AdminButton, AdminCard, AdminTable } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'प्रदेश',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Provinces. Nepal's seven provinces (lib/site.ts). The article-count
 * column is a best-effort match against the article's optional `province`
 * field. Not every CMS story is required to carry that field, so the count
 * is honest (it may read 0). The intent is to surface the
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
        subtitle="नेपालका सात प्रदेश — प्रदेश सम्पादक कार्यप्रवाहका लागि आधार"
        action={
          <AdminButton
            href="/admin/users"
            title="प्रयोगकर्ता व्यवस्थापनमा प्रदेश सम्पादक भूमिका दिनुहोस्"
          >
            + प्रदेश सम्पादक नियुक्ति
          </AdminButton>
        }
      />

      <AdminCard className="overflow-hidden !p-0">
        <AdminTable>
          <thead>
            <tr>
              <th lang="ne">प्रदेश (ने)</th>
              <th className="hidden sm:table-cell" lang="ne">
                प्रदेश (En)
              </th>
              <th lang="ne">स्लग</th>
              <th className="!text-right" lang="ne">
                समाचार
              </th>
              <th lang="ne">पृष्ठ</th>
            </tr>
          </thead>
          <tbody>
            {PROVINCES.map((p) => {
              const count = countsByProvince.get(p.slug) ?? 0
              return (
                <tr key={p.slug}>
                  <td>
                    <Link
                      href={`/province/${p.slug}`}
                      className="font-display font-semibold text-ink hover:text-brand-strong"
                      lang="ne"
                    >
                      {p.nameNe}
                    </Link>
                  </td>
                  <td className="hidden text-meta text-ink-soft sm:table-cell" lang="en">
                    {p.nameEn}
                  </td>
                  <td>
                    <code
                      className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft"
                      lang="en"
                    >
                      {p.slug}
                    </code>
                  </td>
                  <td className="!text-right font-display text-h2 text-ink">
                    {count > 0 ? count : '—'}
                  </td>
                  <td>
                    <AdminButton
                      href={`/province/${p.slug}`}
                      variant="ghost"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="!min-h-8 !px-2.5 !py-1 !text-caption"
                    >
                      <span lang="ne">हेर्नुहोस्</span>
                    </AdminButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </AdminTable>
      </AdminCard>

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
