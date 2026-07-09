'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'
import { localizeHref } from '@/lib/i18n/locales'

type Props = { locale: 'ne' | 'en' }

export function JournalistLoginForm({ locale }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ne = locale === 'ne'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
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
            String(
              body?.message ??
                body?.error?.message ??
                (ne ? 'इमेल वा पासवर्ड मिलेन।' : 'Email or password is incorrect.'),
            ),
          )
          return
        }
        router.refresh()
        router.push(localizeHref(locale, '/journalist/dashboard'))
      } catch {
        setError(ne ? 'नेटवर्क त्रुटि। पुनः प्रयास गर्नुहोस्।' : 'Network error. Try again.')
      }
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      {error ? (
        <div role="alert" className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong">
          {error}
        </div>
      ) : null}

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        <span lang={ne ? 'ne' : 'en'}>{ne ? 'न्युजरुम इमेल' : 'Newsroom email'}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="reporter@nagarikwatch.com"
          className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

      <PasswordField
        name="password"
        label={ne ? 'पासवर्ड' : 'Password'}
        autoComplete="current-password"
        required
        disabled={pending}
        showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
        hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
      />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (ne ? 'लगइन हुँदै…' : 'Signing in…') : ne ? 'पत्रकार लगइन' : 'Journalist sign in'}
      </button>
    </form>
  )
}
