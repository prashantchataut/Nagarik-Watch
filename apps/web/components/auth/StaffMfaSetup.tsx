'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { PasswordField } from '@/components/forms/PasswordField'

type Enrollment = {
  totpURI: string
  backupCodes: string[]
}

export function StaffMfaSetup({ locale }: { locale: 'ne' | 'en' }) {
  const router = useRouter()
  const ne = locale === 'ne'
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function begin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    startTransition(async () => {
      const response = await fetch('/api/auth/two-factor/enable', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password, issuer: 'Nagarik Watch' }),
      })
      const body = (await response.json().catch(() => null)) as
        | Enrollment
        | { message?: string }
        | null
      if (!response.ok || !body || !('totpURI' in body)) {
        setError(
          (body && 'message' in body && body.message) ||
            (ne ? 'MFA सुरु गर्न सकिएन।' : 'Could not start MFA enrollment.'),
        )
        return
      }
      setEnrollment({ totpURI: body.totpURI, backupCodes: body.backupCodes })
    })
  }

  function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const code = String(new FormData(event.currentTarget).get('code') ?? '').replace(/\s/g, '')
    startTransition(async () => {
      const response = await fetch('/api/auth/two-factor/verify-totp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code, trustDevice: true }),
      })
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      if (!response.ok) {
        setError(
          body?.message || (ne ? 'कोड मिलेन। फेरि प्रयास गर्नुहोस्।' : 'Invalid code. Try again.'),
        )
        return
      }
      router.replace('/admin/dashboard')
      router.refresh()
    })
  }

  if (!enrollment) {
    return (
      <form onSubmit={begin} className="grid gap-5">
        <p className="text-body text-ink-soft">
          {ne
            ? 'न्यूजरुम सुरक्षाका लागि authenticator app अनिवार्य छ। सुरु गर्न आफ्नो पासवर्ड पुष्टि गर्नुहोस्।'
            : 'An authenticator app is required for newsroom access. Confirm your password to begin.'}
        </p>
        <PasswordField
          name="password"
          label={ne ? 'हालको पासवर्ड' : 'Current password'}
          autoComplete="current-password"
          required
          disabled={pending}
          variant="newsroom"
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
        {error ? (
          <p role="alert" className="text-meta font-semibold text-brand-strong">
            {error}
          </p>
        ) : null}
        <button
          className="min-h-11 rounded-md bg-brand px-5 font-bold text-surface"
          disabled={pending}
        >
          {pending
            ? ne
              ? 'तयार हुँदै…'
              : 'Preparing…'
            : ne
              ? 'Authenticator जोड्नुहोस्'
              : 'Connect authenticator'}
        </button>
      </form>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="w-fit rounded-lg border border-rule bg-white p-4">
        <QRCodeSVG value={enrollment.totpURI} size={220} level="M" />
      </div>
      <p className="break-all text-caption text-ink-soft">{enrollment.totpURI}</p>
      <div>
        <h2 className="font-display text-h2 text-ink">
          {ne ? 'Recovery codes' : 'Recovery codes'}
        </h2>
        <p className="mt-1 text-meta text-ink-soft">
          {ne
            ? 'यी कोड सुरक्षित password manager मा राख्नुहोस्।'
            : 'Store these once in a secure password manager.'}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-meta">
          {enrollment.backupCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>
      <form onSubmit={verify} className="grid gap-4">
        <label className="grid gap-1.5 font-semibold">
          <span>{ne ? '६-अङ्कको कोड' : '6-digit code'}</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            disabled={pending}
            className="rounded-md border border-rule px-4 py-3 text-xl tracking-[0.35em]"
          />
        </label>
        {error ? (
          <p role="alert" className="text-meta font-semibold text-brand-strong">
            {error}
          </p>
        ) : null}
        <button
          className="min-h-11 rounded-md bg-brand px-5 font-bold text-surface"
          disabled={pending}
        >
          {pending
            ? ne
              ? 'जाँचिँदै…'
              : 'Verifying…'
            : ne
              ? 'MFA सक्रिय गर्नुहोस्'
              : 'Activate MFA'}
        </button>
      </form>
    </div>
  )
}
