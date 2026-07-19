'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReaderSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import {
  accountKindLabel,
  deskLinksForRole,
  resolveAccountKind,
  roleDisplayLabel,
} from '@/lib/account-identity'
import { signOutRequest } from '@/lib/auth/sign-out-client'

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
        const response = await signOutRequest()
        if (!response.ok) throw new Error(`Sign-out failed: ${response.status}`)
        router.refresh()
        router.push(ne ? '/' : '/en')
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : ne
              ? 'साइन आउट गर्न सकिएन।'
              : 'Could not sign out.',
        )
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
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
          error?: { message?: string }
        }
        if (!response.ok) {
          throw new Error(
            body.message || body.error?.message || `Profile update failed: ${response.status}`,
          )
        }
        setSuccess(ne ? 'प्रोफाइल सुरक्षित भयो।' : 'Profile saved.')
        router.refresh()
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : ne
              ? 'प्रोफाइल सुरक्षित गर्न सकिएन।'
              : 'Could not save profile.',
        )
      }
    })
  }

  return (
    <section className="account-card" lang={ne ? 'ne' : 'en'}>
      <p className="account-card__meta">
        {accountKindLabel(kind, locale)}
        <span aria-hidden="true"> · </span>
        {roleDisplayLabel(session.role, locale)}
      </p>

      {error ? (
        <div role="alert" className="account-card__alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="account-card__ok">
          {success}
        </div>
      ) : null}

      {desks.length > 1 ? (
        <nav className="account-card__desks" aria-label={ne ? 'डेस्क' : 'Desks'}>
          {desks.map((desk) => (
            <Link key={desk.href} href={desk.href} className="account-card__desk-link">
              {ne ? desk.labelNe : desk.labelEn}
            </Link>
          ))}
        </nav>
      ) : null}

      <form onSubmit={saveProfile} className="account-card__form">
        <label className="account-field">
          <span>{ne ? 'देखाउने नाम' : 'Display name'}</span>
          <input
            name="displayName"
            defaultValue={session.displayName ?? ''}
            maxLength={120}
            autoComplete="name"
            disabled={saving}
          />
        </label>
        <label className="account-field">
          <span>{ne ? 'मनपर्ने भाषा' : 'Preferred language'}</span>
          <select name="locale" defaultValue={session.locale} disabled={saving}>
            <option value="ne">नेपाली</option>
            <option value="en">English</option>
          </select>
        </label>
        <div className="account-card__actions">
          <button type="submit" className="account-btn account-btn--primary" disabled={saving}>
            {saving ? (ne ? 'सुरक्षित हुँदै…' : 'Saving…') : ne ? 'सुरक्षित गर्नुहोस्' : 'Save'}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="account-btn account-btn--ghost"
            disabled={signingOut}
          >
            {signingOut
              ? ne
                ? 'साइन आउट…'
                : 'Signing out…'
              : ne
                ? 'साइन आउट'
                : 'Sign out'}
          </button>
        </div>
      </form>
    </section>
  )
}
