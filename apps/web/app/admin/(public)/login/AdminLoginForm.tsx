'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'
import { AdminButton } from '@/components/admin/primitives'

/**
 * Admin login form. Posts credentials to Better Auth's /api/auth/sign-in/email
 * endpoint, then on success redirects to /admin/dashboard.
 */
export function AdminLoginForm({
  resetComplete = false,
  databaseOnline = true,
  expectedEmails = [],
}: {
  resetComplete?: boolean
  databaseOnline?: boolean
  expectedEmails?: string[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!databaseOnline) {
      setError('Database is offline. Try again after DATABASE_URL is healthy.')
      return
    }
    const form = new FormData(e.currentTarget)
    if (requiresTotp) {
      const code = String(form.get('code') ?? '').replace(/\s/g, '')
      if (!/^\d{6}$/.test(code)) {
        setError('Enter the 6-digit code from your authenticator app.')
        return
      }
      startTransition(async () => {
        const response = await fetch('/api/auth/two-factor/verify-totp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, trustDevice: true }),
        })
        if (!response.ok) {
          setError('Invalid or expired authenticator code.')
          return
        }
        router.replace('/admin/dashboard')
        router.refresh()
      })
      return
    }
    // Better Auth looks up email case-sensitively; boot accounts are always lowercased.
    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase()
    const password = String(form.get('password') ?? '')

    if (!email || !password) {
      setError('Enter both email and password.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const code =
            (typeof body?.code === 'string' && body.code) ||
            (typeof body?.error?.code === 'string' && body.error.code) ||
            ''
          const message = String(body?.message ?? body?.error?.message ?? '')
          if (res.status === 503 || code === 'AUTH_UNAVAILABLE') {
            setError('Sign-in unavailable. The account database could not be reached.')
            return
          }
          if (res.status === 429 || /TOO_MANY|RATE/i.test(message + code)) {
            setError('Too many sign-in attempts. Wait about a minute, then try again.')
            return
          }
          if (code === 'ACCOUNT_DISABLED') {
            setError('This account has been disabled by the newsroom.')
            return
          }
          if (
            code === 'INVALID_ORIGIN' ||
            code === 'MISSING_OR_NULL_ORIGIN' ||
            /ORIGIN|CSRF/i.test(message + code)
          ) {
            setError(
              'Request blocked by origin checks. Use https://www.nagarikwatch.com/admin/login (not a cached or extension-injected page), then hard-refresh.',
            )
            return
          }
          if (res.status === 403) {
            setError(message || 'Sign-in was forbidden. Try again from www.nagarikwatch.com.')
            return
          }
          if (res.status === 401 || /not found|invalid password|INVALID/i.test(message + code)) {
            const emailHint =
              expectedEmails.length > 0
                ? ` Exact emails: ${expectedEmails.join(', ')}.`
                : ''
            setError(
              `Wrong email or password.${emailHint} Password must match the Vercel NEWSROOM_*_PASSWORD for that email. Refresh this page once to re-sync, then try again.`,
            )
            return
          }
          setError(message || 'Sign-in failed. Try again.')
          return
        }
        if (body?.twoFactorRedirect === true) {
          setRequiresTotp(true)
          return
        }
        router.replace('/admin/dashboard')
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="newsroom-login-form" noValidate autoComplete="on">
      {resetComplete ? (
        <div role="status" className="newsroom-login-form__ok">
          Password updated. Sign in with your new password.
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="newsroom-login-form__error">
          {error}
        </div>
      ) : null}

      {!requiresTotp ? (
        <label className="newsroom-login-form__field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            disabled={pending || !databaseOnline}
            placeholder="you@example.com"
            className="newsroom-login-form__input"
          />
        </label>
      ) : null}

      {!requiresTotp ? (
        <PasswordField
          name="password"
          label="Password"
          autoComplete="current-password"
          required
          disabled={pending || !databaseOnline}
          variant="newsroom"
          helpText="Use your newsroom password."
          showLabel="Show"
          hideLabel="Hide"
        />
      ) : (
        <label className="newsroom-login-form__field">
          <span>Authenticator code</span>
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

      <AdminButton
        type="submit"
        disabled={pending || !databaseOnline}
        className="w-full"
      >
        {pending ? 'Verifying…' : requiresTotp ? 'Verify code' : 'Sign in'}
      </AdminButton>
    </form>
  )
}
