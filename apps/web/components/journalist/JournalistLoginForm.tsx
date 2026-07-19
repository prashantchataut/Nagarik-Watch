'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'
import { localizeHref } from '@/lib/i18n/locales'
import { authClientErrorMessage } from '@/lib/auth/client-errors'
import { ADMIN_BASE_ROLES, JOURNALIST_DESK_ROLES, type NewsroomRole } from '@/lib/admin-roles'

type Props = { locale: 'ne' | 'en' }

export function JournalistLoginForm({ locale }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [pending, startTransition] = useTransition()
  const ne = locale === 'ne'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    if (requiresTotp) {
      const code = String(form.get('code') ?? '').replace(/\s/g, '')
      if (!/^\d{6}$/.test(code)) {
        setError(
          ne
            ? 'Authenticator को ६-अङ्कको कोड राख्नुहोस्।'
            : 'Enter the 6-digit authenticator code.',
        )
        return
      }
      startTransition(async () => {
        const response = await fetch('/api/auth/two-factor/verify-totp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code, trustDevice: true }),
        })
        if (!response.ok) {
          setError(ne ? 'कोड मिलेन वा म्याद सकियो।' : 'Invalid or expired authenticator code.')
          return
        }
        router.refresh()
        router.push(localizeHref(locale, '/journalist/dashboard'))
      })
      return
    }
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase()
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
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const code =
            (body as { error?: { code?: string }; code?: string }).error?.code ??
            (body as { code?: string }).code
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
        if ((body as { twoFactorRedirect?: boolean }).twoFactorRedirect === true) {
          setRequiresTotp(true)
          return
        }

        const sessionRes = await fetch('/api/auth/get-session', { cache: 'no-store' })
        const sessionBody = (await sessionRes.json().catch(() => null)) as {
          user?: { role?: string }
        } | null
        const role = (sessionBody?.user?.role ?? 'reader') as NewsroomRole

        if (ADMIN_BASE_ROLES.has(role) && !JOURNALIST_DESK_ROLES.has(role)) {
          router.refresh()
          router.push('/admin/dashboard')
          return
        }

        if (!JOURNALIST_DESK_ROLES.has(role) && role !== 'copy_editor' && role !== 'fact_checker') {
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

      {!requiresTotp ? (
        <label className="newsroom-login-form__field">
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'पत्रकार इमेल' : 'Reporter email'}</span>
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
      ) : null}

      {!requiresTotp ? (
        <PasswordField
          name="password"
          label={ne ? 'पासवर्ड' : 'Password'}
          autoComplete="current-password"
          required
          disabled={pending}
          variant="newsroom"
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
      ) : (
        <label className="newsroom-login-form__field">
          <span>{ne ? 'Authenticator कोड' : 'Authenticator code'}</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoFocus
            disabled={pending}
            className="newsroom-login-form__input"
          />
        </label>
      )}

      <button type="submit" disabled={pending} className="newsroom-login-form__submit">
        {pending
          ? ne
            ? 'जाँचिँदै…'
            : 'Verifying…'
          : requiresTotp
            ? ne
              ? 'कोड जाँच्नुहोस्'
              : 'Verify code'
            : ne
              ? 'रिपोर्टर डेस्क खोल्नुहोस्'
              : 'Open reporter desk'}
      </button>
    </form>
  )
}
