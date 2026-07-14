'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReaderSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import {
  accountKindBadgeClass,
  accountKindLabel,
  deskLinksForRole,
  resolveAccountKind,
  roleDisplayLabel,
} from '@/lib/account-identity'

export function ReaderProfileCard({ session, locale }: { session: ReaderSession; locale: Locale }) {
  const router = useRouter()
  const [signingOut, startSignOut] = useTransition()
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const ne = locale === 'ne'
  const kind = resolveAccountKind(session.role)
  const desks = deskLinksForRole(session.role, locale)

  function signOut() {
    setError(null)
    startSignOut(async () => {
      try {
        const response = await fetch('/api/auth/sign-out', { method: 'POST' })
        if (!response.ok) throw new Error(`Sign-out failed: ${response.status}`)
        router.refresh()
        router.push(ne ? '/' : '/en')
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : ne ? 'साइन आउट गर्न सकिएन।' : 'Could not sign out.')
      }
    })
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const displayName = String(data.get('displayName') ?? '').trim()
    const preferredLocale = data.get('locale') === 'en' ? 'en' : 'ne'
    setError(null)
    setSuccess(null)
    startSaving(async () => {
      try {
        const response = await fetch('/api/auth/update-user', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: displayName || session.email.split('@')[0],
            displayName: displayName || null,
            locale: preferredLocale,
          }),
        })
        const body = (await response.json().catch(() => ({}))) as { message?: string; error?: { message?: string } }
        if (!response.ok) throw new Error(body.message || body.error?.message || `Profile update failed: ${response.status}`)
        setSuccess(ne ? 'प्रोफाइल अद्यावधिक भयो।' : 'Profile updated.')
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : ne ? 'प्रोफाइल सुरक्षित गर्न सकिएन।' : 'Could not save profile.')
      }
    })
  }

  const initials = (session.displayName || session.email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <section className="rounded-lg border border-rule bg-surface-raised p-6">
      {error ? <div role="alert" className="mb-4 rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong">{error}</div> : null}
      {success ? <div role="status" className="mb-4 rounded-md border border-rule bg-surface px-4 py-3 text-meta font-semibold text-ink-soft">{success}</div> : null}
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand font-display text-h1 font-bold text-surface" aria-hidden="true">{initials || 'N'}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-h2 text-ink" lang={ne ? 'ne' : 'en'}>{session.displayName || session.email.split('@')[0]}</p>
          <p className="truncate text-meta text-ink-soft" lang="en">{session.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-md border px-2 py-0.5 text-caption font-bold ${accountKindBadgeClass(kind)}`} lang={ne ? 'ne' : 'en'}>
              {accountKindLabel(kind, locale)}
            </span>
            <span className="text-caption text-mute" lang={ne ? 'ne' : 'en'}>
              {roleDisplayLabel(session.role, locale)} · {session.locale === 'ne' ? 'नेपाली' : 'English'}
            </span>
          </div>
        </div>
      </div>

      {desks.length > 1 ? (
        <nav className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4" aria-label={ne ? 'डेस्क लिंक' : 'Desk links'}>
          {desks.map((desk) => (
            <Link
              key={desk.href}
              href={desk.href}
              className="inline-flex h-9 items-center rounded-full border border-rule px-3 text-caption font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            >
              {ne ? desk.labelNe : desk.labelEn}
            </Link>
          ))}
        </nav>
      ) : null}

      <form onSubmit={saveProfile} className="mt-6 grid gap-4 border-t border-rule pt-5" lang={ne ? 'ne' : 'en'}>
        <label className="grid gap-1.5 text-meta font-semibold text-ink">
          {ne ? 'देखाउने नाम' : 'Display name'}
          <input
            name="displayName"
            defaultValue={session.displayName ?? ''}
            maxLength={120}
            autoComplete="name"
            disabled={saving}
            className="h-11 rounded-md border border-rule bg-surface px-3.5 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-meta font-semibold text-ink">
          {ne ? 'मनपर्ने संस्करण' : 'Preferred edition'}
          <select name="locale" defaultValue={session.locale} disabled={saving} className="h-11 rounded-md border border-rule bg-surface px-3.5 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60">
            <option value="ne">नेपाली</option>
            <option value="en">English</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:cursor-wait disabled:opacity-60">
            {saving ? (ne ? 'सुरक्षित हुँदै…' : 'Saving…') : ne ? 'प्रोफाइल सुरक्षित गर्नुहोस्' : 'Save profile'}
          </button>
          <button type="button" onClick={signOut} disabled={signingOut} className="inline-flex h-10 items-center justify-center rounded-full border border-breaking/40 px-4 text-meta font-semibold text-breaking hover:bg-breaking hover:text-surface focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:cursor-wait disabled:opacity-50">
            {signingOut ? (ne ? 'साइन आउट हुँदै…' : 'Signing out…') : ne ? 'साइन आउट' : 'Sign out'}
          </button>
        </div>
      </form>
    </section>
  )
}
