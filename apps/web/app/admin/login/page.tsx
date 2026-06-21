import { authEnvironment } from '@/lib/admin'

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong">
        Protected newsroom
      </p>
      <h1 className="mt-1 font-display text-h1 text-ink">Admin login scaffold</h1>
      <p className="mt-3 text-body text-ink-soft">
        Authentication is intentionally not faked. Connect Better Auth or Payload auth with the
        environment variables below, then protect all `/admin/*` routes server-side.
      </p>
      <form className="mt-6 grid gap-4 rounded-lg border border-rule bg-surface-raised p-5">
        <label className="grid gap-1 text-meta font-semibold text-ink">
          Email
          <input
            className="rounded-md border border-rule bg-surface px-3 py-2 text-body"
            type="email"
            placeholder="editor@nagarikwatch.com"
            disabled
          />
        </label>
        <label className="grid gap-1 text-meta font-semibold text-ink">
          Password
          <input
            className="rounded-md border border-rule bg-surface px-3 py-2 text-body"
            type="password"
            placeholder="Connect auth provider"
            disabled
          />
        </label>
        <button
          type="button"
          disabled
          className="rounded-full bg-brand px-5 py-2.5 text-body font-semibold text-surface opacity-60"
        >
          Disabled until auth is configured
        </button>
      </form>
      <ul className="mt-5 list-disc pl-5 text-caption text-ink-soft">
        {authEnvironment.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </main>
  )
}
