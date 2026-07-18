'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getOrCreateReaderId } from '@/lib/reader/consent'
import {
  READER_PREFERENCES_EVENT,
  readLocalReaderPreferences,
  writeLocalReaderPreferences,
} from '@/lib/reader/preferences'
import type { ReaderPreferences } from '@/lib/reader/preferences-store'

type AlertItem = {
  id: string
  title: string
  url: string
  publishedAt: string
  kind: 'breaking' | 'followed_topic' | 'followed_author' | 'daily_digest' | 'marketing'
  reason: 'breaking' | 'follow' | 'digest'
  score: number
  seen: boolean
  read: boolean
}

export function NotificationCenter({ locale, className }: { locale: Locale; className?: string }) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [preferences, setPreferences] = useState<ReaderPreferences | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [unread, setUnread] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [pushRegistered, setPushRegistered] = useState(false)
  const [showPrimer, setShowPrimer] = useState(false)
  const pushPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_KEY?.trim() ?? ''
  const english = locale === 'en'

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'Notification' in window
    setSupported(ok)
    if (ok) setPermission(Notification.permission)
    if (ok && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => setPushRegistered(Boolean(subscription))).catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function refresh(showBrowserAlert = false) {
      const fingerprint = getOrCreateReaderId()
      try {
        const response = await fetch(`/api/notifications?locale=${locale}&fingerprint=${encodeURIComponent(fingerprint)}`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Notification request failed: ${response.status}`)
        const body = await response.json() as { alerts?: AlertItem[]; unread?: number; preferences?: ReaderPreferences }
        if (cancelled) return
        const nextAlerts = body.alerts ?? []
        const unseen = nextAlerts.filter((item) => !item.seen).slice(0, 8)
        setAlerts(unseen.length
          ? nextAlerts.map((item) => unseen.some((candidate) => candidate.id === item.id) ? { ...item, seen: true } : item)
          : nextAlerts)
        setUnread(Number(body.unread ?? 0))
        if (body.preferences) {
          setPreferences(body.preferences)
          writeLocalReaderPreferences(body.preferences)
        }
        setStatus('ready')
        if (unseen.length) {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ fingerprint, action: 'seen', eventIds: unseen.map((item) => item.id) }),
          }).catch(() => undefined)
          if (showBrowserAlert && Notification.permission === 'granted' && body.preferences?.browserAlerts) {
            await showNotification(unseen[0]!, locale)
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setPreferences(readLocalReaderPreferences())
        }
      }
    }
    void refresh(false)
    const timer = window.setInterval(() => void refresh(true), 90_000)
    const onPreferenceChange = () => void refresh(false)
    window.addEventListener(READER_PREFERENCES_EVENT, onPreferenceChange)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener(READER_PREFERENCES_EVENT, onPreferenceChange)
    }
  }, [locale])

  async function enableBrowserAlerts() {
    if (!supported) return
    if (permission === 'default' && !showPrimer) {
      setShowPrimer(true)
      return
    }
    const nextPermission = await Notification.requestPermission()
    setShowPrimer(false)
    setPermission(nextPermission)
    if (nextPermission !== 'granted') return
    let registered = false
    if (pushPublicKey && 'serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        const subscription = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(pushPublicKey),
        })
        const response = await fetch('/api/notifications/subscription', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fingerprint: getOrCreateReaderId(), locale, subscription: subscription.toJSON() }),
        })
        if (!response.ok) throw new Error(`Push registration failed: ${response.status}`)
        registered = true
      } catch {
        registered = false
      }
    }
    setPushRegistered(registered)
    const current = preferences ?? readLocalReaderPreferences()
    if (!current) return
    const next = { ...current, browserAlerts: true }
    setPreferences(next)
    writeLocalReaderPreferences(next)
    await savePreferences(next)
  }

  async function disableBrowserAlerts() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await fetch('/api/notifications/subscription', {
            method: 'DELETE', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ fingerprint: getOrCreateReaderId(), endpoint: subscription.endpoint }),
          }).catch(() => undefined)
          await subscription.unsubscribe()
        }
      } catch {}
    }
    setPushRegistered(false)
    const current = preferences ?? readLocalReaderPreferences()
    if (!current) return
    const next = { ...current, browserAlerts: false }
    setPreferences(next)
    writeLocalReaderPreferences(next)
    await savePreferences(next)
  }

  async function savePreferences(next: ReaderPreferences) {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fingerprint: getOrCreateReaderId(), ...next }),
    }).catch(() => undefined)
  }

  async function openAlert(alert: AlertItem) {
    setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, read: true } : item))
    setUnread((value) => Math.max(0, value - (alert.read ? 0 : 1)))
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fingerprint: getOrCreateReaderId(), action: 'read', eventIds: [alert.id] }),
      keepalive: true,
    }).catch(() => undefined)
    window.location.assign(safeAlertPath(alert.url))
  }

  return (
    <aside className={`notification-desk ${className ?? ''}`} aria-labelledby="notification-desk-title" lang={english ? 'en' : 'ne'}>
      <header className="notification-desk__header">
        <div>
          <p className="editorial-kicker" lang="en">Alert desk</p>
          <h2 id="notification-desk-title">{english ? 'News worth interrupting you for' : 'तपाईंलाई रोक्न लायक सूचना'}</h2>
        </div>
        <span className="notification-desk__count" aria-label={english ? `${unread} unread alerts` : `${unread} नपढिएका सूचना`}>{unread}</span>
      </header>
      <p className="notification-desk__dek">
        {english
          ? 'Breaking news and followed desks are ranked by freshness, relevance, quiet hours and alert fatigue. Marketing is off.'
          : 'ब्रेकिङ र पछ्याइएका विषयका सूचना ताजापन, सान्दर्भिकता, शान्त समय र सूचना थकान हेरेर क्रमबद्ध हुन्छन्। प्रचार सूचना बन्द छन्।'}
      </p>

      <div className="notification-desk__permission">
        <div>
          <strong>{english ? 'Browser alerts' : 'ब्राउजर सूचना'}</strong>
          <small>{!supported ? (english ? 'Not supported in this browser' : 'यो ब्राउजरमा उपलब्ध छैन') : pushRegistered ? (english ? 'Background push is connected' : 'पृष्ठभूमि सूचना जोडिएको छ') : pushPublicKey ? (english ? `Permission: ${permission}` : `अनुमति: ${permission}`) : (english ? 'Live alerts work while the site is open; background push needs provider configuration.' : 'साइट खुला हुँदा प्रत्यक्ष सूचना आउँछ; पृष्ठभूमि सूचनाका लागि provider configuration चाहिन्छ।')}</small>
        </div>
        {preferences?.browserAlerts ? (
          <button type="button" onClick={disableBrowserAlerts} className="text-action">{english ? 'Turn off' : 'बन्द गर्नुहोस्'}</button>
        ) : (
          <button type="button" onClick={enableBrowserAlerts} disabled={!supported || permission === 'denied'} className="text-action">{english ? 'Enable' : 'खोल्नुहोस्'}</button>
        )}
      </div>
      {showPrimer ? (
        <div className="notification-desk__primer" role="group" aria-labelledby="notification-primer-title">
          <strong id="notification-primer-title">
            {english ? 'Choose before the browser asks' : 'ब्राउजरले सोध्नुअघि आफैँ छनोट गर्नुहोस्'}
          </strong>
          <p>
            {english
              ? 'Allow alerts only if you want breaking news and followed-topic updates. You can turn them off here at any time.'
              : 'ब्रेकिङ समाचार र पछ्याइएका विषयका अपडेट चाहनुहुन्छ भने मात्र अनुमति दिनुहोस्। यहाँबाट जुनसुकै बेला बन्द गर्न सक्नुहुन्छ।'}
          </p>
          <div>
            <button type="button" className="text-action" onClick={() => void enableBrowserAlerts()}>
              {english ? 'Continue to browser choice' : 'ब्राउजर छनोटमा जानुहोस्'}
            </button>
            <button type="button" onClick={() => setShowPrimer(false)}>
              {english ? 'Not now' : 'अहिले होइन'}
            </button>
          </div>
        </div>
      ) : null}

      {status === 'error' ? (
        <p className="notification-desk__state" role="status">{english ? 'Alerts could not refresh. Your preferences remain saved.' : 'सूचना ताजा गर्न सकिएन। तपाईंका छनोट सुरक्षित छन्।'}</p>
      ) : null}
      {status === 'loading' ? (
        <p className="notification-desk__state" role="status">{english ? 'Checking your alert desk…' : 'तपाईंको सूचना डेस्क जाँचिँदै…'}</p>
      ) : null}

      {alerts.length ? (
        <ol className="notification-desk__list">
          {alerts.slice(0, 6).map((alert) => (
            <li key={alert.id} data-read={alert.read}>
              <button type="button" onClick={() => void openAlert(alert)}>
                <span className="notification-desk__reason">{alert.reason === 'breaking' ? (english ? 'Breaking' : 'ब्रेकिङ') : alert.reason === 'follow' ? (english ? 'You follow this' : 'तपाईंले पछ्याएको') : (english ? 'Digest' : 'सार')}</span>
                <strong>{alert.title}</strong>
                <small>{new Date(alert.publishedAt).toLocaleString(english ? 'en-GB' : 'ne-NP')} · {Math.round(alert.score)}</small>
              </button>
            </li>
          ))}
        </ol>
      ) : status === 'ready' ? (
        <div className="notification-desk__empty">
          <strong>{english ? 'No eligible alerts right now' : 'अहिले योग्य सूचना छैन'}</strong>
          <p>{english ? 'Follow desks, topics or journalists to make this feed useful.' : 'यो सूची उपयोगी बनाउन विभाग, विषय वा पत्रकार पछ्याउनुहोस्।'}</p>
        </div>
      ) : null}
    </aside>
  )
}


function safeAlertPath(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return '/'
    if (/^\/(api|admin|journalist|auth)(\/|$)/.test(url.pathname)) return '/'
    if (/^\/(en\/)?(auth|journalist)(\/|$)/.test(url.pathname)) return '/'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/'
  }
}

async function showNotification(item: AlertItem, locale: Locale) {
  const title = item.reason === 'breaking'
    ? locale === 'en' ? 'Nagarik Watch breaking' : 'नागरिक वाच ब्रेकिङ'
    : locale === 'en' ? 'From your Nagarik Watch desk' : 'तपाईंको नागरिक वाच डेस्कबाट'
  const options: NotificationOptions = {
    body: item.title,
    tag: item.id,
    data: { url: safeAlertPath(item.url) },
    icon: '/apple-icon.png',
    badge: '/apple-icon.png',
  }
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, options)
      return
    } catch {}
  }
  try { new Notification(title, options) } catch {}
}


function decodeVapidKey(value: string): BufferSource {
  const padding = '='.repeat((4 - value.length % 4) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}
