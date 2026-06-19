import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

type FooterProps = {
  locale: Locale
}

/**
 * Site chrome bottom — the wordmark, a sections column, an about/ethics/privacy column, and
 * the legal line that carries the DoIB publication-registration placeholder (Task 1.4). The
 * registration number is read from NEXT_PUBLIC_DOIB_NUMBER and is shown as "pending" until
 * the registrar grants it; the placeholder is the agreed location, so filling it later needs
 * no code change beyond the env var.
 */
export function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale)
  const year = new Date().getFullYear()

  const sectionLinks = [
    { href: localizeHref(locale, '/about'), label: dict.footerAbout },
    { href: localizeHref(locale, '/ethics'), label: dict.footerEthics },
    { href: localizeHref(locale, '/privacy'), label: dict.footerPrivacy },
    { href: localizeHref(locale, '/contact'), label: dict.footerContact },
  ]

  return (
    <footer className="mt-16 border-t border-rule bg-surface">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-12 md:grid-cols-3">
        <div className="md:col-span-1">
          <p className="font-display text-h2 text-ink" lang="ne">
            {dict.siteName}
          </p>
          <p className="mt-1 text-meta text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
            {dict.tagline}
          </p>
          <p className="mt-4 max-w-xs text-caption text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
            {dict.footerDisclaimer}
          </p>
        </div>

        <nav aria-label={dict.footerSections} className="md:col-span-1">
          <p className="text-meta font-semibold uppercase tracking-wide text-mute">
            {dict.footerSections}
          </p>
          <ul className="mt-3 space-y-2">
            {sectionLinks.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                  lang={locale === 'en' ? 'en' : 'ne'}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-1">
          <p className="text-meta font-semibold uppercase tracking-wide text-mute">
            {dict.footerRegistration}
          </p>
          <p className="mt-3 text-body text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
            {process.env.NEXT_PUBLIC_DOIB_NUMBER ?? dict.footerRegistrationPending}
          </p>
        </div>
      </div>

      <div className="border-t border-rule">
        <p
          className="mx-auto max-w-page px-4 py-4 text-caption text-mute"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {dict.footerCopyright(year)}
        </p>
      </div>
    </footer>
  )
}
