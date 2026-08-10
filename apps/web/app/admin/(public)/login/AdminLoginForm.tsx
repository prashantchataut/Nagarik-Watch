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
      setError('डाटाबेस अफलाइन छ। DATABASE_URL ठीक भएपछि फेरि प्रयास गर्नुहोस्।')
      return
    }
    const form = new FormData(e.currentTarget)
    if (requiresTotp) {
      const code = String(form.get('code') ?? '').replace(/\s/g, '')
      if (!/^\d{6}$/.test(code)) {
        setError('Authenticator बाट ६-अङ्कको कोड राख्नुहोस्।')
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
          setError('कोड मिलेन वा म्याद सकियो।')
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
      setError('इमेल र पासवर्ड दुवै भर्नुहोस्।')
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
            setError('लगइन उपलब्ध छैन। खाता डाटाबेस पुग्न सकेन।')
            return
          }
          if (res.status === 429 || /TOO_MANY|RATE/i.test(message + code)) {
            setError('धेरै प्रयास भयो। करिब एक मिनेटपछि फेरि प्रयास गर्नुहोस्।')
            return
          }
          if (code === 'ACCOUNT_DISABLED') {
            setError('यो खाता न्युजरुमले निष्क्रिय गरेको छ।')
            return
          }
          if (
            code === 'INVALID_ORIGIN' ||
            code === 'MISSING_OR_NULL_ORIGIN' ||
            /ORIGIN|CSRF/i.test(message + code)
          ) {
            setError(
              'Origin जाँचले अनुरोध रोकेको छ। www.nagarikwatch.com/admin/login बाट खोल्नुहोस्, त्यसपछि हार्ड-रिफ्रेस गर्नुहोस्।',
            )
            return
          }
          if (res.status === 403) {
            setError(
              message || 'लगइन अस्वीकृत भयो। www.nagarikwatch.com बाट फेरि प्रयास गर्नुहोस्।',
            )
            return
          }
          if (res.status === 401 || /not found|invalid password|INVALID/i.test(message + code)) {
            const emailHint =
              expectedEmails.length > 0 && process.env.NODE_ENV !== 'production'
                ? ` अपेक्षित इमेल: ${expectedEmails.join(', ')}।`
                : ''
            setError(`इमेल वा पासवर्ड मिलेन।${emailHint} पृष्ठ रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।`)
            return
          }
          setError(message || 'लगइन असफल। फेरि प्रयास गर्नुहोस्।')
          return
        }
        if (body?.twoFactorRedirect === true) {
          setRequiresTotp(true)
          return
        }
        router.replace('/admin/dashboard')
      } catch {
        setError('नेटवर्क त्रुटि। फेरि प्रयास गर्नुहोस्।')
      }
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="newsroom-login-form"
      noValidate
      autoComplete="on"
      lang="ne"
    >
      {resetComplete ? (
        <div role="status" className="newsroom-login-form__ok">
          पासवर्ड अद्यावधिक भयो। नयाँ पासवर्डले साइन इन गर्नुहोस्।
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="newsroom-login-form__error">
          {error}
        </div>
      ) : null}

      {!requiresTotp ? (
        <label className="newsroom-login-form__field">
          <span>इमेल</span>
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
          label="पासवर्ड"
          autoComplete="current-password"
          required
          disabled={pending || !databaseOnline}
          variant="newsroom"
          helpText="न्युजरुम पासवर्ड प्रयोग गर्नुहोस्।"
          showLabel="देखाउनुहोस्"
          hideLabel="लुकाउनुहोस्"
        />
      ) : (
        <label className="newsroom-login-form__field">
          <span>Authenticator कोड</span>
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

      <AdminButton type="submit" disabled={pending || !databaseOnline} className="w-full">
        {pending ? 'जाँच हुँदै…' : requiresTotp ? 'कोड पुष्टि' : 'साइन इन'}
      </AdminButton>
    </form>
  )
}
