'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'

type AlertItem = {
  id: string
  title: string
  url: string
  publishedAt: string
}

const PREF_KEY = 'nw-notification-pref-v1'
const SEEN_KEY = 'nw-notification-seen-v1'

export function NotificationCenter({ locale, className }: { locale: Locale; className?: string }) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [enabled, setEnabled] = useState(false)
  const [latest, setLatest] = useState<AlertItem | null>(null)
  const lang = locale === 'en' ? 'en' : 'ne'

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'Notification' in window
    setSupported(ok)
    if (!ok) return
    setPermission(Notification.permission)
    setEnabled(localStorage.getItem(PREF_KEY) === 'breaking')
  }, [])

  useEffect(() => {
    if (!enabled || permission !== 'granted') return
    let cancelled = false

    async function check() {
      try {
        const response = await fetch(`/api/notifications/breaking?locale=${locale}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as { alerts?: AlertItem[] }
        if (cancelled) return
        const first = data.alerts?.[0]
        if (!first) return
        setLatest(first)
        const seen = safeSeen()
        if (!seen.includes(first.id)) {
          await showNotification(first, locale)
          localStorage.setItem(SEEN_KEY, JSON.stringify([first.id, ...seen].slice(0, 50)))
        }
      } catch {}
    }

    check()
    const timer = window.setInterval(check, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [enabled, locale, permission])

  async function enable() {
    if (!supported) return
    const next = await Notification.requestPermission()
    setPermission(next)
    if (next === 'granted') {
      localStorage.setItem(PREF_KEY, 'breaking')
      setEnabled(true)
    }
  }

  function disable() {
    localStorage.removeItem(PREF_KEY)
    setEnabled(false)
  }

  return (
    <aside
      className={className}
      lang={lang}
      aria-label={locale === 'en' ? 'Notification settings' : 'सूचना सेटिङ'}
    >
      <div className="h-full rounded-2xl border border-rule bg-surface-raised p-4 sm:p-5">
        <p
          className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong"
          lang="en"
        >
          Alerts
        </p>
        <h2 className="mt-1 font-display text-h2 font-extrabold text-ink">
          {locale === 'en' ? 'Breaking alerts on this device' : 'यो उपकरणमा ब्रेकिङ सूचना'}
        </h2>
        <p className="mt-2 text-meta leading-relaxed text-ink-soft">
          {locale === 'en'
            ? 'This browser can show alerts while the site is open. Background push requires OneSignal, FCM or Web Push credentials.'
            : 'साइट खुला हुँदा यो ब्राउजरले सूचना देखाउन सक्छ। साइट बन्द हुँदा आउने push का लागि OneSignal, FCM वा Web Push credential चाहिन्छ।'}
        </p>
        <div className="mt-4 rounded-lg border border-rule bg-surface p-3 text-caption text-ink-soft">
          {supported
            ? locale === 'en'
              ? `Browser permission: ${permission}`
              : `ब्राउजर अनुमति: ${permission}`
            : locale === 'en'
              ? 'This browser does not expose the Notification API.'
              : 'यो ब्राउजरमा Notification API उपलब्ध छैन।'}
        </div>
        {latest ? (
          <a
            href={latest.url}
            className="mt-3 block rounded-lg border border-rule bg-surface p-3 text-meta font-semibold text-ink hover:border-brand hover:bg-brand-tint"
          >
            {latest.title}
          </a>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={!supported || permission === 'denied'}
            className="inline-flex min-h-10 items-center rounded-full bg-brand px-4 text-meta font-semibold text-surface transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enabled
              ? locale === 'en'
                ? 'Alerts on'
                : 'सूचना खुला'
              : locale === 'en'
                ? 'Enable alerts'
                : 'सूचना खोल्नुहोस्'}
          </button>
          {enabled ? (
            <button
              type="button"
              onClick={disable}
              className="inline-flex min-h-10 items-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            >
              {locale === 'en' ? 'Turn off' : 'बन्द गर्नुहोस्'}
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function safeSeen(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as unknown
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

async function showNotification(item: AlertItem, locale: Locale) {
  const title = locale === 'en' ? 'Breaking from Nagarik Watch' : 'नागरिक वाच ब्रेकिङ'
  const options: NotificationOptions = {
    body: item.title,
    tag: item.id,
    data: { url: item.url },
    icon: '/icon.png',
    badge: '/icon.png',
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
      return
    } catch {}
  }

  try {
    new Notification(title, options)
  } catch {}
}
