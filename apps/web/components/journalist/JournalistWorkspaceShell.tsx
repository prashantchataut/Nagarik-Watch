import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistSignOutButton } from '@/components/journalist/JournalistSignOutButton'

export function JournalistWorkspaceShell({
  locale,
  name,
  roleLabel,
  active,
  children,
}: {
  locale: Locale
  name: string
  roleLabel: string
  active: 'dashboard' | 'assignments' | 'new' | 'tools' | 'feedback' | 'profile'
  children: ReactNode
}) {
  const ne = locale === 'ne'
  const primaryItems = [
    ['dashboard', '/journalist/dashboard', ne ? 'डेस्क' : 'Desk'],
    ['assignments', '/journalist/assignments', ne ? 'मेरा समाचार' : 'My stories'],
    ['new', '/journalist/articles/new', ne ? 'नयाँ ड्राफ्ट' : 'New draft'],
  ] as const
  const supportItems = [
    ['feedback', '/journalist/feedback', ne ? 'सम्पादकीय प्रतिक्रिया' : 'Editorial feedback'],
    ['tools', '/journalist/tools', ne ? 'लेखन उपकरण' : 'Writing tools'],
    ['profile', '/journalist/profile', ne ? 'प्रोफाइल' : 'Profile'],
  ] as const
  const mobileItems = [
    ['dashboard', '/journalist/dashboard', ne ? 'डेस्क' : 'Desk'],
    ['assignments', '/journalist/assignments', ne ? 'समाचार' : 'Stories'],
    ['new', '/journalist/articles/new', ne ? 'नयाँ' : 'New'],
    ['feedback', '/journalist/feedback', ne ? 'प्रतिक्रिया' : 'Feedback'],
    ['profile', '/journalist/profile', ne ? 'प्रोफाइल' : 'Profile'],
  ] as const

  return (
    <div className="newsroom-workspace min-h-screen" lang={ne ? 'ne' : 'en'}>
      <a className="skip-link" href="#newsroom-main">
        {ne ? 'मुख्य सामग्रीमा जानुहोस्' : 'Skip to content'}
      </a>
      <aside className="newsroom-sidebar">
        <Link
          href={localizeHref(locale, '/journalist/dashboard')}
          className="newsroom-sidebar__brand"
        >
          <Logo
            siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'}
            className="max-w-[10rem]"
            tone="onDark"
          />
          <span className="newsroom-sidebar__desk-label">
            {ne ? 'पत्रकार कार्यक्षेत्र' : 'Reporter workspace'}
          </span>
        </Link>

        <nav aria-label={ne ? 'पत्रकार नेभिगेसन' : 'Journalist navigation'}>
          <div className="newsroom-sidebar__group">
            <p>{ne ? 'समाचार काम' : 'Story work'}</p>
            {primaryItems.map(([key, href, label]) => (
              <Link
                key={key}
                href={localizeHref(locale, href)}
                aria-current={active === key ? 'page' : undefined}
                className={`${active === key ? 'is-active ' : ''}${key === 'new' ? 'is-primary' : ''}`.trim() || undefined}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="newsroom-sidebar__group">
            <p>{ne ? 'समर्थन' : 'Support'}</p>
            {supportItems.map(([key, href, label]) => (
              <Link
                key={key}
                href={localizeHref(locale, href)}
                aria-current={active === key ? 'page' : undefined}
                className={active === key ? 'is-active' : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="newsroom-sidebar__identity">
          <strong>{name}</strong>
          <span>{roleLabel}</span>
          <Link href={localizeHref(locale, '/')}>{ne ? 'सार्वजनिक साइट खोल्नुहोस्' : 'Open public site'}</Link>
          <JournalistSignOutButton locale={locale} />
        </div>
      </aside>

      <div className="newsroom-main" id="newsroom-main">
        <header
          className="newsroom-mobilebar"
          aria-label={ne ? 'पत्रकार छोटो नेभिगेसन' : 'Journalist quick navigation'}
        >
          {mobileItems.map(([key, href, label]) => (
            <Link
              key={key}
              href={localizeHref(locale, href)}
              aria-current={active === key ? 'page' : undefined}
              className={active === key ? 'is-active' : key === 'new' ? 'is-primary' : undefined}
            >
              {label}
            </Link>
          ))}
        </header>
        {children}
      </div>
    </div>
  )
}
