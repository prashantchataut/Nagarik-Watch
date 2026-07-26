'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordField } from '@/components/forms/PasswordField'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { authClientErrorMessage } from '@/lib/auth/client-errors'

/**
 * Reader login form. Same shape as AdminLoginForm but reader-scoped: on
 * success redirects to the locale's /saved page (the reader's home for
 * bookmarks + history), and the "forgot password" link points at the
 * reader-facing recovery flow backed by Better Auth and the configured email provider.
 */
export function ReaderLoginForm({ locale, next, notice, googleEnabled = false }: { locale: 'ne' | 'en'; next?: string | null; notice?: 'reset' | 'invite' | null; googleEnabled?: boolean }) {
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

    if (!email || !password) {
      setError(ne ? 'कृपया इमेल र पासवर्ड भर्नुहोस्।' : 'Please enter email and password.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(authClientErrorMessage(res.status, body, locale))
          return
        }
        router.refresh()
        router.push(safeNext(next) ?? (ne ? '/saved/' : '/en/saved/'))
      } catch {
        setError(
          ne
            ? 'लगइन सर्भर अहिले उपलब्ध छैन। सुरक्षित समाचार यस उपकरणमा अझै काम गर्छ।'
            : 'Sign-in server is unavailable right now. Saved stories still work on this device.',
        )
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {notice ? (
        <div role="status" className="rounded-md border border-rule bg-surface-raised px-4 py-3 text-meta font-semibold text-ink" lang={ne ? 'ne' : 'en'}>
          {notice === 'reset'
            ? (ne ? 'पासवर्ड परिवर्तन भयो। नयाँ पासवर्ड प्रयोग गरेर लगइन गर्नुहोस्।' : 'Password updated. Sign in with your new password.')
            : (ne ? 'न्युजरुम निमन्त्रणा स्वीकार भयो। भूमिका सक्रिय गर्न फेरि लगइन गर्नुहोस्।' : 'Newsroom invitation accepted. Sign in again to activate your role.')}
        </div>
      ) : null}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
        >
          {error}
        </div>
      )}

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        <span lang={ne ? 'ne' : 'en'}>{ne ? 'इमेल' : 'Email'}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="you@example.com"
          className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

      <div lang={ne ? 'ne' : 'en'}>
        <PasswordField
          name="password"
          label={ne ? 'पासवर्ड' : 'Password'}
          autoComplete="current-password"
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
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'लगइन हुँदै…' : 'Signing in…'}</span>
        ) : (
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'लगइन गर्नुहोस्' : 'Sign in'}</span>
        )}
      </button>

      <SocialAuthButtons locale={locale} googleEnabled={googleEnabled} />

      <div className="flex items-center justify-between text-caption">
        <Link
          href={ne ? '/auth/forgot-password/' : '/en/auth/forgot-password/'}
          className="text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
        >
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'पासवर्ड भुल्नुभयो?' : 'Forgot password?'}</span>
        </Link>
        <Link
          href={`${ne ? '' : '/en'}/auth/signup/${safeNext(next) ? `?next=${encodeURIComponent(safeNext(next)!)}` : ''}`}
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'नयाँ खाता' : 'Sign up'}</span>
        </Link>
      </div>
      <p className="text-center text-caption text-mute" lang={ne ? 'ne' : 'en'}>
        <Link href={ne ? '/saved/' : '/en/saved/'} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
          {ne ? 'उपकरणमा सुरक्षित समाचार' : 'Saved stories on this device'}
        </Link>
      </p>
    </form>
  )
}

function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, 'https://nagarikwatch.local')
    return url.origin === 'https://nagarikwatch.local' ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
