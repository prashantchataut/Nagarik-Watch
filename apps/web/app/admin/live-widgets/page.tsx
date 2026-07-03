import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getProviderHealth } from '@/lib/live/health'
import { formatDate } from '@nagarikwatch/db'
import {
  AdminPageHeader,
  AdminCard,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लाइभ विजेट',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Live widgets configuration. Calls getProviderHealth() — the same call
 * the dashboard uses — and renders the full provider table. The dashboard
 * shows the summary; this page is the detailed operations view: env vars,
 * source, last-updated timestamp, error message. The note at the top
 * explains the fallback policy: when an env var is missing, the widget
 * falls back to mock data so the homepage still renders.
 */
export default async function LiveWidgetsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const providers = await getProviderHealth().catch(() => [])

  const statusLabel: Record<string, string> = {
    ok: 'सक्रिय',
    mock: 'नमुना',
    unconfigured: 'अव्यवस्थित',
    error: 'त्रुटि',
  }
  const statusTone: Record<string, string> = {
    ok: 'bg-brand-tint text-brand-strong',
    mock: 'bg-gold/20 text-ink',
    unconfigured: 'border border-rule text-mute',
    error: 'bg-breaking/15 text-breaking',
  }

  return (
    <div>
      <AdminPageHeader
        title="लाइभ विजेट"
        subtitle={`${providers.length} वटा बाह्य डाटा प्रदायकको स्थिति`}
      />

      <AdminCard className="mb-5 border-l-4 border-l-brand">
        <p className="text-body text-ink" lang="ne">
          प्रदायकको <code className="font-mono text-ink-soft" lang="en">API_KEY</code> नकन्फिगर
          गरिएको अवस्थामा विजेट स्वतः नमुना डाटामा फर्कन्छ — गृहपृष्ठ खण्डित हुँदैन।
          तलको तालिकामा प्रत्येक प्रदायकको स्थिति, आवश्यक पर्ने env चर, स्रोत र अन्तिम
          अपडेट समय देखिन्छ।
        </p>
      </AdminCard>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">प्रदायक</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">आवश्यक env</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell" lang="ne">स्रोत</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="ne">अन्तिम अपडेट</th>
              <th className="px-4 py-3 font-semibold" lang="ne">त्रुटि</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {providers.map((p) => (
              <tr key={p.key} className="hover:bg-brand-tint/30">
                <td className="px-4 py-3 align-top">
                  <p className="font-display font-semibold text-ink" lang="ne">
                    {p.label}
                  </p>
                  <code className="font-mono text-caption text-mute" lang="en">
                    {p.key}
                  </code>
                </td>
                <td className="hidden px-4 py-3 align-top md:table-cell">
                  <ul className="flex flex-col gap-1">
                    {p.envVars.map((v) => (
                      <li key={v}>
                        <code className="font-mono text-caption text-ink-soft" lang="en">
                          {v}
                        </code>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${statusTone[p.status] ?? 'border border-rule text-mute'}`}
                    lang="ne"
                  >
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 align-top text-meta text-ink-soft lg:table-cell" lang="en">
                  {p.source}
                </td>
                <td className="hidden px-4 py-3 align-top text-caption text-mute sm:table-cell" lang="ne">
                  {p.updatedAt ? formatDate(p.updatedAt, 'ne') : '—'}
                </td>
                <td className="px-4 py-3 align-top text-caption text-breaking" lang="ne">
                  {p.error ? (
                    <span className="line-clamp-2">{p.error}</span>
                  ) : (
                    <span className="text-mute">—</span>
                  )}
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-body text-mute" lang="ne">
                  कुनै प्रदायक जाँच्न सकिएन।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
