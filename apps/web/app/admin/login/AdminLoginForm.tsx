'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'

/**
 * Admin login form. Posts credentials to Better Auth's /api/auth/sign-in/email
 * endpoint, then on success redirects to /admin/dashboard.
 */
export function AdminLoginForm({
  resetComplete = false,
  databaseOnline = true,
}: {
  resetComplete?: boolean
  databaseOnline?: boolean
  /** @deprecated unused — kept for call-site compatibility during deploy */
  expectedEmails?: string[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!databaseOnline) {
      setError('Database is offline. Try again after DATABASE_URL is healthy.')
      return
    }
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
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
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const code = typeof body?.error?.code === 'string' ? body.error.code : ''
          const message = String(body?.message ?? body?.error?.message ?? '')
          if (res.status === 503 || code === 'AUTH_UNAVAILABLE') {
            setError('Sign-in unavailable. The account database could not be reached.')
            return
          }
          if (res.status === 401 || /not found|invalid password|INVALID/i.test(message + code)) {
            setError('Wrong email or password.')
            return
          }
          setError(message || 'Sign-in failed. Try again.')
          return
        }
        router.refresh()
        router.push('/admin/dashboard')
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="newsroom-login-form" noValidate>
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

      <label className="newsroom-login-form__field">
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={pending || !databaseOnline}
          placeholder="admin@nagarikwatch.com"
          className="newsroom-login-form__input"
        />
      </label>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        required
        disabled={pending || !databaseOnline}
        showLabel="Show"
        hideLabel="Hide"
      />

      <button type="submit" disabled={pending || !databaseOnline} className="newsroom-login-form__submit">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
