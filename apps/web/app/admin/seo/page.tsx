import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { SITE_URL } from '@/lib/site'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'एसइओ', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function SeoPage() {
  await requireNewsroomSession()
  const checks = [
    ['Canonical domain', SITE_URL],
    ['Sitemap', `${SITE_URL}/sitemap.xml`],
    ['News sitemap', `${SITE_URL}/news-sitemap.xml`],
    ['RSS', `${SITE_URL}/rss.xml`],
    ['Robots', `${SITE_URL}/robots.txt`],
  ] as const
  return (
    <div>
      <AdminPageHeader title="एसइओ" subtitle="Google News, canonical and discovery readiness" />
      <AdminCard><div className="grid gap-3">{checks.map(([label, value]) => <div key={label} className="rounded-lg border border-rule bg-surface p-4"><p className="text-caption font-bold uppercase tracking-wide text-mute">{label}</p><p className="mt-1 break-all font-mono text-meta text-ink">{value}</p></div>)}</div></AdminCard>
    </div>
  )
}
