'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string }

export type DeferredInstallPrompt = Event & {
  prompt(): Promise<void>
  userChoice: Promise<InstallChoice>
}

const ARTICLE_OPENS_KEY = 'nw:pwa:article-opens'
const LAST_VISIT_KEY = 'nw:pwa:last-visit'
const SNOOZE_UNTIL_KEY = 'nw:pwa:snooze-until'
const DISMISSED_UNTIL_KEY = 'nw:pwa:dismissed-until'
const ARTICLE_THRESHOLD = 3
const DAY = 86_400_000

function isArticlePath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const offset = parts[0] === 'en' ? 1 : 0
  if (parts.length - offset !== 2) return false
  return !new Set([
    'admin',
    'api',
    'auth',
    'journalist',
    'reader-corner',
    'saved',
    'search',
    'latest',
    'trending',
    'most-read',
    'membership',
    'contact',
    'about',
    'tag',
    'author',
    'province',
    'district',
  ]).has(parts[offset] ?? '')
}

function dataSaverEnabled() {
  return document.documentElement.dataset.saveData === '1'
}

export function InstallPrompt() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null)
  const [eligible, setEligible] = useState(false)
  const [visible, setVisible] = useState(false)
  const english = pathname === '/en' || pathname.startsWith('/en/')

  useEffect(() => {
    // Defer the native mini-infobar so Install can call prompt() from our UI.
    // Chrome logs a warning until prompt() runs; that is expected, not a content bug.
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as DeferredInstallPrompt)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    const now = Date.now()
    const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) ?? 0)
    const returnVisit = lastVisit > 0 && now - lastVisit > 12 * 60 * 60 * 1000
    localStorage.setItem(LAST_VISIT_KEY, String(now))

    let opens = Number(localStorage.getItem(ARTICLE_OPENS_KEY) ?? 0)
    if (isArticlePath(pathname)) {
      const sessionKey = `nw:pwa:opened:${pathname}`
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1')
        opens += 1
        localStorage.setItem(ARTICLE_OPENS_KEY, String(opens))
      }
    }
    setEligible(returnVisit || opens >= ARTICLE_THRESHOLD)
  }, [pathname])

  useEffect(() => {
    if (!deferredPrompt || !eligible || dataSaverEnabled()) return
    const now = Date.now()
    const blockedUntil = Math.max(
      Number(localStorage.getItem(SNOOZE_UNTIL_KEY) ?? 0),
      Number(localStorage.getItem(DISMISSED_UNTIL_KEY) ?? 0),
    )
    if (blockedUntil > now) return
    setVisible(true)
  }, [deferredPrompt, eligible])

  async function install() {
    if (!deferredPrompt) return
    setVisible(false)
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'dismissed') {
      localStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + 7 * DAY))
    }
    setDeferredPrompt(null)
  }

  function postpone(days: number, key: string) {
    localStorage.setItem(key, String(Date.now() + days * DAY))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside className="install-prompt" role="dialog" aria-labelledby="install-prompt-title">
      <div>
        <strong id="install-prompt-title">
          {english
            ? 'Read Nagarik Watch from your home screen'
            : 'होम स्क्रिनबाट नागरिक वाच पढ्नुहोस्'}
        </strong>
        <p>
          {english
            ? 'Install the app for quicker access and articles you have opened while offline.'
            : 'छिटो पहुँच र खोलिसकेका समाचार अफलाइन पढ्न एप स्थापना गर्नुहोस्।'}
        </p>
      </div>
      <div className="install-prompt__actions">
        <button type="button" className="text-action" onClick={() => void install()}>
          {english ? 'Install' : 'स्थापना'}
        </button>
        <button type="button" onClick={() => postpone(7, SNOOZE_UNTIL_KEY)}>
          {english ? 'Maybe later' : 'पछि सम्झाउनुहोस्'}
        </button>
        <button
          type="button"
          aria-label={english ? 'Dismiss install suggestion' : 'स्थापना सुझाव बन्द गर्नुहोस्'}
          onClick={() => postpone(30, DISMISSED_UNTIL_KEY)}
        >
          ×
        </button>
      </div>
    </aside>
  )
}
