'use client'

import { useState } from 'react'

/**
 * Social sign-in affordances for reader auth screens.
 * Google stays disabled until NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true and a real
 * Better Auth socialProviders.google config is wired — no fake OAuth.
 */
export function SocialAuthButtons({
  locale,
  googleEnabled,
}: {
  locale: 'ne' | 'en'
  googleEnabled: boolean
}) {
  const ne = locale === 'ne'
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  async function signInWithGoogle() {
    if (!googleEnabled || pending) return
    setPending(true)
    setError(false)
    try {
      const response = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: 'google',
          callbackURL: locale === 'en' ? '/en/auth/profile' : '/auth/profile',
        }),
      })
      const result = (await response.json()) as { url?: string }
      if (!response.ok || !result.url) throw new Error('Google sign-in could not start.')
      window.location.assign(result.url)
    } catch {
      setError(true)
      setPending(false)
    }
  }

  if (!googleEnabled) {
    return null
  }

  return (
    <div className="auth-social">
      <div className="auth-social__divider" aria-hidden="true">
        <span>{ne ? 'वा' : 'or'}</span>
      </div>
      <button
        type="button"
        className="auth-social__google"
        disabled={pending}
        onClick={() => void signInWithGoogle()}
      >
        <GoogleGlyph />
        <span lang={ne ? 'ne' : 'en'}>
          {pending
            ? ne
              ? 'गुगल खोल्दै…'
              : 'Opening Google…'
            : ne
              ? 'गुगलसँग जारी राख्नुहोस्'
              : 'Continue with Google'}
        </span>
      </button>
      {error ? (
        <p className="auth-social__hint" role="alert" lang={ne ? 'ne' : 'en'}>
          {ne ? 'गुगल साइन-इन सुरु गर्न सकिएन।' : 'Google sign-in could not be started.'}
        </p>
      ) : null}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.5 29.3 3.5 24 3.5 12.4 3.5 3 12.9 3 24.5S12.4 45.5 24 45.5 45 36.1 45 24.5c0-1.4-.1-2.7-.4-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12.5 24 12.5c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.5 29.3 3.5 24 3.5 16.3 3.5 9.7 7.8 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 41 16.3 45.5 24 45.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.5 6.9l.1.1 6.2 5.2C37 42.5 45 36.5 45 24.5c0-1.4-.1-2.7-.4-4z" />
    </svg>
  )
}
