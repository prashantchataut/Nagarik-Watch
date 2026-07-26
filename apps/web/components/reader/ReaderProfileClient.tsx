'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type SessionPayload = {
  user?: { email?: string; name?: string | null }
}

/**
 * Static-friendly profile: tries live session API when present; otherwise
 * offers sign-in and always links to device bookmarks.
 */
export function ReaderProfileClient({ locale }: { locale: Locale }) {
  const english = locale === 'en'
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/get-session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null
        return (await response.json()) as SessionPayload
      })
      .then((body) => {
        if (cancelled) return
        setEmail(body?.user?.email?.trim() || null)
      })
      .catch(() => {
        if (!cancelled) setEmail(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const links = [
    {
      href: localizeHref(locale, '/saved'),
      title: english ? 'Saved stories' : 'सुरक्षित समाचार',
      body: english ? 'Bookmarks kept on this device.' : 'यस उपकरणमा सुरक्षित गरिएका समाचार।',
    },
    {
      href: localizeHref(locale, '/auth/login'),
      title: english ? 'Sign in' : 'लगइन',
      body: english
        ? 'Optional account for syncing across devices.'
        : 'उपकरणबीच सिंक गर्न वैकल्पिक खाता।',
    },
    {
      href: localizeHref(locale, '/auth/signup'),
      title: english ? 'Create account' : 'खाता बनाउनुहोस्',
      body: english ? 'Free. Reading stays open either way.' : 'निःशुल्क। पढाइ सधैं खुला रहन्छ।',
    },
  ]

  return (
    <div className="account-page account-page--wide" lang={english ? 'en' : 'ne'}>
      <header className="account-page__header">
        <h1>{english ? 'Account' : 'खाता'}</h1>
        <p className="account-page__email">
          {!ready
            ? english
              ? 'Loading…'
              : 'लोड हुँदै…'
            : email
              ? email
              : english
                ? 'Browsing as guest on this device'
                : 'यस उपकरणमा अतिथिका रूपमा'}
        </p>
      </header>

      {!email && ready ? (
        <p className="account-card__ok" role="status">
          {english
            ? 'You can save stories on this device without an account. Sign in when account sync is available.'
            : 'खाता बिना पनि यस उपकरणमा समाचार सुरक्षित गर्न सकिन्छ। खाता सिंक उपलब्ध हुँदा लगइन गर्नुहोस्।'}
        </p>
      ) : null}

      <nav className="account-page__links" aria-label={english ? 'Account links' : 'खाता लिंक'}>
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="account-page__link">
            <span className="account-page__link-title">{item.title}</span>
            <span className="account-page__link-body">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
