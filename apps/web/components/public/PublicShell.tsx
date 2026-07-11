import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { categories } from '@/lib/content/seed/categories'
import { localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'

export function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const en = locale === 'en'
  return <>
    <a className="skip-link" href="#main">{en ? 'Skip to content' : 'मुख्य सामग्रीमा जानुहोस्'}</a>
    <header className="public-header">
      <div className="public-header__top">
        <Link href={localizeHref(locale, '/')} aria-label="Nagarik Watch home"><Logo /></Link>
        <div className="public-header__actions">
          <Link href={localizeHref(locale, '/utilities')}>{en ? 'Utilities' : 'उपयोगिता'}</Link>
          <Link href={localizeHref(locale, '/live-scores')}>{en ? 'Live scores' : 'प्रत्यक्ष स्कोर'}</Link>
          <Link href={localizeHref(locale, '/disaster-alerts')}>{en ? 'Alerts' : 'विपद् सूचना'}</Link>
          <Link href={localizeHref(locale, '/auth/login')}>{en ? 'Sign in' : 'लग इन'}</Link>
          <Link href={en ? '/' : '/en'}>{en ? 'नेपाली' : 'English'}</Link>
        </div>
      </div>
      <nav className="public-nav" aria-label={en ? 'Sections' : 'समाचार विभाग'}>
        {categories.filter(c=>c.showInNav).slice(0,10).map(c=><Link key={c.slug} href={localizeHref(locale, `/${c.slug}`)}>{en ? c.nameEn : c.nameNe}</Link>)}
      </nav>
    </header>
    <main id="main">{children}</main>
    <footer className="public-footer"><strong>Nagarik Watch</strong><p>{en ? 'Independent reporting and public-service information for Nepal.' : 'नेपालका लागि स्वतन्त्र पत्रकारिता र जनसेवा सूचना।'}</p></footer>
  </>
}
