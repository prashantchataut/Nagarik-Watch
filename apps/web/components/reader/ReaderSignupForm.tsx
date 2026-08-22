'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordField } from '@/components/forms/PasswordField'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { authClientErrorMessage } from '@/lib/auth/client-errors'

/**
 * Reader sign-up form. Posts to Better Auth's /api/auth/sign-up/email endpoint.
 * On success, redirects to /saved (the reader's bookmark/history home) so the
 * new reader immediately sees the value of their account.
 *
 * Display name is optional; if omitted we derive from the email local part.
 */
export function ReaderSignupForm({
  locale,
  next,
  googleEnabled = false,
}: {
  locale: 'ne' | 'en'
  next?: string | null
  googleEnabled?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ne = locale === 'ne'

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const displayName = String(form.get('displayName') ?? '').trim()
    const confirm = String(form.get('confirm') ?? '')

    if (!email || !password) {
      setError(ne ? 'कृपया इमेल र पासवर्ड भर्नुहोस्।' : 'Please enter email and password.')
      return
    }
    if (password.length < 8) {
      setError(
        ne ? 'पासवर्ड कम्तिमा ८ अक्षरको हुनुपर्छ।' : 'Password must be at least 8 characters.',
      )
      return
    }
    if (password !== confirm) {
      setError(ne ? 'पासवर्ड मेल खाएन।' : 'Passwords do not match.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: displayName || email.split('@')[0],
            displayName: displayName || undefined,
            locale,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(authClientErrorMessage(res.status, body, locale))
          return
        }
        router.refresh()
        router.push(safeNext(next) ?? (ne ? '/saved' : '/en/saved'))
      } catch {
        setError(
          ne
            ? 'खाता सर्भर अहिले उपलब्ध छैन। सुरक्षित समाचार यस उपकरणमा अझै काम गर्छ।'
            : 'Account server is unavailable right now. Saved stories still work on this device.',
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error && (
        <div
          role="alert"
          className="border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
        >
          {error}
        </div>
      )}

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        <span lang={ne ? 'ne' : 'en'}>
          {ne ? 'देखाउने नाम (वैकल्पिक)' : 'Display name (optional)'}
        </span>
        <input
          name="displayName"
          type="text"
          autoComplete="name"
          disabled={pending}
          placeholder={ne ? 'तपाईंको नाम' : 'Your name'}
          className="border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        <span lang={ne ? 'ne' : 'en'}>{ne ? 'इमेल' : 'Email'}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="you@example.com"
          className="border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

      <div lang={ne ? 'ne' : 'en'}>
        <PasswordField
          name="password"
          label={ne ? 'पासवर्ड' : 'Password'}
          autoComplete="new-password"
          required
          disabled={pending}
          helpText={ne ? 'कम्तिमा ८ अक्षर' : 'At least 8 characters'}
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
      </div>

      <div lang={ne ? 'ne' : 'en'}>
        <PasswordField
          name="confirm"
          label={ne ? 'पासवर्ड पुष्टि' : 'Confirm password'}
          autoComplete="new-password"
          required
          disabled={pending}
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-full items-center justify-center border border-brand bg-brand px-5 text-body font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'खाता बन्दै…' : 'Creating…'}</span>
        ) : (
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'खाता बनाउनुहोस्' : 'Create account'}</span>
        )}
      </button>

      <SocialAuthButtons locale={locale} googleEnabled={googleEnabled} />

      <p className="text-center text-caption text-ink-soft">
        <span lang={ne ? 'ne' : 'en'}>
          {ne ? 'पहिले नै खाता छ? ' : 'Already have an account? '}
        </span>
        <Link
          href={`${ne ? '' : '/en'}/auth/login${safeNext(next) ? `?next=${encodeURIComponent(safeNext(next)!)}` : ''}`}
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'लगइन गर्नुहोस्' : 'Sign in'}</span>
        </Link>
      </p>
    </form>
  )
}

function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, 'https://nagarikwatch.local')
    return url.origin === 'https://nagarikwatch.local'
      ? `${url.pathname}${url.search}${url.hash}`
      : null
  } catch {
    return null
  }
}
