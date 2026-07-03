'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ReaderSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'

/**
 * Reader profile card. Shows the current session's display name, email, role,
 * locale, and a sign-out button. The sign-out posts to Better Auth's sign-out
 * endpoint and redirects to the locale's home page.
 *
 * Display-name editing is a Phase 3 addition; for now the card is read-only
 * so we never surface a half-wired form.
 */
export function ReaderProfileCard({
  session,
  locale,
}: {
  session: ReaderSession
  locale: Locale
}) {
  const router = useRouter()
  const [signingOut, startSignOut] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const ne = locale === 'ne'

  function signOut() {
    startSignOut(async () => {
      try {
        await fetch('/api/auth/sign-out', { method: 'POST' })
        router.refresh()
        router.push(ne ? '/' : '/en')
      } catch {
        setError(ne ? 'साइन आउट गर्न सकिएन।' : 'Could not sign out.')
      }
    })
  }

  const initials = (session.displayName || session.email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  return (
    <section className="rounded-lg border border-rule bg-surface-raised p-6">
      {error && (
        <div role="alert" className="mb-4 rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong">
          {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand font-display text-h1 font-bold text-surface"
          aria-hidden="true"
        >
          {initials || 'N'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-h2 text-ink" lang={ne ? 'ne' : 'en'}>
            {session.displayName || session.email.split('@')[0]}
          </p>
          <p className="truncate text-meta text-ink-soft" lang="en">
            {session.email}
          </p>
          <p className="mt-1 text-caption text-mute" lang={ne ? 'ne' : 'en'}>
            {ne ? 'पाठक खाता' : 'Reader account'} · {session.locale === 'ne' ? 'नेपाली' : 'English'}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-mute" lang={ne ? 'ne' : 'en'}>
            {ne ? 'देखाउने नाम' : 'Display name'}
          </dt>
          <dd className="mt-1 text-body text-ink" lang={ne ? 'ne' : 'en'}>
            {session.displayName || (ne ? 'सेट भएको छैन' : 'Not set')}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-mute" lang={ne ? 'ne' : 'en'}>
            {ne ? 'इमेल' : 'Email'}
          </dt>
          <dd className="mt-1 text-body text-ink" lang="en">
            {session.email}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={signOut}
          disabled={signingOut}
          className="inline-flex h-10 items-center justify-center rounded-full border border-breaking/40 px-4 text-meta font-semibold text-breaking transition-colors duration-fast ease-out-quint hover:bg-breaking hover:text-surface focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:opacity-50"
          lang={ne ? 'ne' : 'en'}
        >
          {signingOut ? (ne ? 'साइन आउट हुँदै…' : 'Signing out…') : (ne ? 'साइन आउट' : 'Sign out')}
        </button>
      </div>
    </section>
  )
}
