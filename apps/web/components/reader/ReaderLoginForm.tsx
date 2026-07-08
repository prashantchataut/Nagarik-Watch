'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordField } from '@/components/forms/PasswordField'

/**
 * Reader login form. Same shape as AdminLoginForm but reader-scoped: on
 * success redirects to the locale's /saved page (the reader's home for
 * bookmarks + history), and the "forgot password" link points at the
 * reader-facing reset flow (mailto for now; self-serve reset is Phase 3).
 */
export function ReaderLoginForm({ locale }: { locale: 'ne' | 'en' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ne = locale === 'ne'

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          setError(
            body?.message ??
              body?.error?.message ??
              (ne ? 'इमेल वा पासवर्ड मेल खाएन।' : 'Email or password is incorrect.'),
          )
          return
        }
        router.refresh()
        router.push(ne ? '/saved' : '/en/saved')
      } catch {
        setError(ne ? 'नेटवर्क त्रुटि।' : 'Network error.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
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
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'लगइन हुँदै…' : 'Signing in…'}</span>
        ) : (
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'लगइन गर्नुहोस्' : 'Sign in'}</span>
        )}
      </button>

      <div className="flex items-center justify-between text-caption">
        <a
          href="mailto:contact@nagarikwatch.com?subject=Reader%20password%20reset"
          className="text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
        >
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'पासवर्ड भुल्नुभयो?' : 'Forgot password?'}</span>
        </a>
        <Link
          href={ne ? '/auth/signup' : '/en/auth/signup'}
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'नयाँ खाता' : 'Sign up'}</span>
        </Link>
      </div>
    </form>
  )
}
