import { AdminShell } from '@/components/admin/AdminShell'
import { getProviderHealth } from '@/lib/live/health'

export default async function Page() {
  const providers = await getProviderHealth()
  const counts = providers.reduce(
    (acc, provider) => {
      acc[provider.status] = (acc[provider.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <AdminShell active="Dashboard">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          `Providers OK: ${counts.ok ?? 0}`,
          `Unconfigured: ${counts.unconfigured ?? 0}`,
          `Mock fallback: ${counts.mock ?? 0}`,
          `Provider errors: ${counts.error ?? 0}`,
        ].map((metric) => (
          <div key={metric} className="rounded-lg border border-rule bg-surface-raised p-4">
            <p className="text-body font-semibold text-ink">{metric}</p>
            <p className="mt-1 text-caption text-mute">Live-widget provider health.</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-rule bg-surface-raised p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-h2 text-ink">Provider health</h2>
            <p className="mt-1 text-body text-ink-soft">
              Demo fallbacks are explicitly marked until real provider credentials are configured.
            </p>
          </div>
          <a href="/admin/live-widgets" className="text-meta font-semibold text-brand-strong">
            Live widget config
          </a>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-rule text-left text-body">
            <thead className="text-caption uppercase tracking-wide text-mute">
              <tr>
                <th className="py-2 pr-4">Provider</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Env vars</th>
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {providers.map((provider) => (
                <tr key={provider.key}>
                  <td className="py-3 pr-4 font-semibold text-ink">{provider.label}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-caption font-semibold text-brand-strong">
                      {provider.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-caption text-ink-soft">
                    {provider.envVars.join(', ')}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{provider.source}</td>
                  <td className="py-3 pr-4 text-caption text-mute">
                    {new Date(provider.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}
