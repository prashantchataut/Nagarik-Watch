'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function JournalistSignOutButton({ locale }: { locale: Locale }) {
  const router = useRouter()
  const ne = locale === 'ne'
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function signOut() {
    setError(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/sign-out', { method: 'POST' })
        if (!response.ok) throw new Error(ne ? 'साइन आउट गर्न सकिएन।' : 'Could not sign out.')
        router.replace(localizeHref(locale, '/journalist/login'))
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : ne ? 'साइन आउट गर्न सकिएन।' : 'Could not sign out.')
      }
    })
  }

  return (
    <div className="newsroom-signout">
      <button type="button" onClick={signOut} disabled={pending}>
        {pending ? (ne ? 'साइन आउट हुँदै…' : 'Signing out…') : ne ? 'साइन आउट' : 'Sign out'}
      </button>
      {error ? <small role="alert">{error}</small> : null}
    </div>
  )
}
