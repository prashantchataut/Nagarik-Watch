'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'
import { localizeHref } from '@/lib/i18n/locales'
import { authClientErrorMessage } from '@/lib/auth/client-errors'
import { CONTRIBUTOR_ROLES, type NewsroomRole } from '@/lib/admin-roles'

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
          const code = (body as { error?: { code?: string }; code?: string }).error?.code
            ?? (body as { code?: string }).code
          if (code === 'ACCOUNT_DISABLED' || res.status === 403) {
            setError(
              ne
                ? 'यो खाता न्यूजरुमद्वारा निष्क्रिय गरिएको छ।'
                : 'This account has been disabled by the newsroom.',
            )
            return
          }
          setError(authClientErrorMessage(res.status, body, locale))
          return
        }

        const sessionRes = await fetch('/api/auth/get-session', { cache: 'no-store' })
        const sessionBody = (await sessionRes.json().catch(() => null)) as {
          user?: { role?: string }
        } | null
        const role = sessionBody?.user?.role ?? 'reader'
        if (!CONTRIBUTOR_ROLES.has(role as NewsroomRole)) {
          router.refresh()
          router.push(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
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
    <form onSubmit={submit} className="newsroom-login-form" noValidate>
      {error ? (
        <div role="alert" className="newsroom-login-form__error">
          {error}
        </div>
      ) : null}

      <label className="newsroom-login-form__field">
        <span lang={ne ? 'ne' : 'en'}>{ne ? 'न्युजरुम इमेल' : 'Newsroom email'}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="reporter@nagarikwatch.com"
          className="newsroom-login-form__input"
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
        className="newsroom-login-form__submit"
      >
        {pending ? (ne ? 'लगइन हुँदै…' : 'Signing in…') : ne ? 'पत्रकार लगइन' : 'Journalist sign in'}
      </button>
    </form>
  )
}
