import Link from 'next/link'
import { adminSections, editorialWorkflow, newsroomRoles, permissions } from '@/lib/admin'

export function AdminShell({
  active = 'Dashboard',
  children,
}: {
  active?: string
  children?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-rule bg-surface-raised">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong">
              Newsroom CMS
            </p>
            <h1 className="font-display text-h1 text-ink">{active}</h1>
          </div>
          <Link
            href="/admin/login"
            className="rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
          >
            Sign in scaffold
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-page gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-rule bg-surface-raised p-3">
          <nav aria-label="Admin navigation">
            <ul className="space-y-1">
              {adminSections.map(([label, href]) => (
                <li key={href}>
                  <Link
                    className={`block rounded-md px-3 py-2 text-meta ${label === active ? 'bg-brand-tint font-semibold text-brand-strong' : 'text-ink-soft hover:bg-brand-tint/60 hover:text-brand-strong'}`}
                    href={href}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="grid gap-6">
          {children ?? (
            <>
              <section className="grid gap-4 md:grid-cols-4">
                {['Drafts: 12', 'Pending review: 6', 'Published today: 4', 'SEO issues: 3'].map(
                  (metric) => (
                    <div
                      key={metric}
                      className="rounded-lg border border-rule bg-surface-raised p-4"
                    >
                      <p className="text-body font-semibold text-ink">{metric}</p>
                      <p className="mt-1 text-caption text-mute">
                        Placeholder until database and analytics connect.
                      </p>
                    </div>
                  ),
                )}
              </section>
              <section className="rounded-lg border border-rule bg-surface-raised p-5">
                <h2 className="font-display text-h2 text-ink">Editorial workflow</h2>
                <ol className="mt-4 flex flex-wrap gap-2">
                  {editorialWorkflow.map((stage) => (
                    <li
                      key={stage}
                      className="rounded-full border border-rule px-3 py-1 text-caption font-semibold text-ink-soft"
                    >
                      {stage}
                    </li>
                  ))}
                </ol>
              </section>
              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-rule bg-surface-raised p-5">
                  <h2 className="font-display text-h2 text-ink">Roles</h2>
                  <ul className="mt-3 columns-1 text-body text-ink-soft md:columns-2">
                    {newsroomRoles.map((role) => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-rule bg-surface-raised p-5">
                  <h2 className="font-display text-h2 text-ink">Permissions</h2>
                  <ul className="mt-3 columns-1 text-body text-ink-soft md:columns-2">
                    {permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
