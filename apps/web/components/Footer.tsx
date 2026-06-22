import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { LogoMark } from '@/components/Logo'
import { NewsletterInline } from '@/components/NewsletterInline'
import { PUBLICATION } from '@/lib/site'

type FooterProps = {
  locale: Locale
}

/**
 * Site chrome bottom — a dense four-column footer modelled on national-grade
 * news portals: brand + social, sections, trust/policy, and contact + daily
 * newsletter capture. The DoIB registration placeholder lives in the contact
 * column; filling NEXT_PUBLIC_DOIB_NUMBER later needs no markup change.
 *
 * Social links point at the publication's accounts. Until real handles exist
 * they point at the homepage and carry a placeholder title; they are never
 * hidden so the affordance is visible and ready.
 */
export function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale)
  const year = new Date().getFullYear()
  const lang = locale === 'en' ? 'en' : 'ne'

  const sectionLinks = [
    { href: localizeHref(locale, '/latest'), label: locale === 'en' ? 'Latest' : 'ताजा' },
    { href: localizeHref(locale, '/trending'), label: locale === 'en' ? 'Trending' : 'ट्रेन्डिङ' },
    { href: localizeHref(locale, '/most-read'), label: locale === 'en' ? 'Most read' : 'धेरै पढिएको' },
    { href: localizeHref(locale, '/editor-picks'), label: locale === 'en' ? "Editor's picks" : 'सम्पादकको रोजाइ' },
    { href: localizeHref(locale, '/exclusive'), label: locale === 'en' ? 'Exclusive' : 'विशेष' },
    { href: localizeHref(locale, '/fact-check'), label: locale === 'en' ? 'Fact check' : 'तथ्य-जाँच' },
    { href: localizeHref(locale, '/opinion'), label: locale === 'en' ? 'Opinion' : 'विचार' },
    { href: localizeHref(locale, '/video'), label: locale === 'en' ? 'Video' : 'भिडियो' },
    { href: localizeHref(locale, '/photos'), label: locale === 'en' ? 'Photos' : 'फोटो' },
  ]

  const aboutLinks = [
    { href: localizeHref(locale, '/about'), label: dict.footerAbout },
    { href: localizeHref(locale, '/team'), label: locale === 'en' ? 'Team' : 'टोली' },
    { href: localizeHref(locale, '/ethics'), label: dict.footerEthics },
    {
      href: localizeHref(locale, '/editorial-policy'),
      label: locale === 'en' ? 'Editorial policy' : 'सम्पादकीय नीति',
    },
    {
      href: localizeHref(locale, '/corrections-policy'),
      label: locale === 'en' ? 'Corrections' : 'सच्याइ',
    },
    {
      href: localizeHref(locale, '/fact-check-policy'),
      label: locale === 'en' ? 'Fact-check policy' : 'तथ्य-जाँच नीति',
    },
    { href: localizeHref(locale, '/privacy'), label: dict.footerPrivacy },
    { href: localizeHref(locale, '/terms'), label: locale === 'en' ? 'Terms' : 'सर्त' },
    { href: localizeHref(locale, '/advertise'), label: locale === 'en' ? 'Advertise' : 'विज्ञापन' },
    { href: localizeHref(locale, '/contact'), label: dict.footerContact },
    { href: '/rss.xml', label: 'RSS' },
  ]

  const registration = process.env.NEXT_PUBLIC_DOIB_NUMBER ?? dict.footerRegistrationPending

  return (
    <footer className="mt-16 border-t border-rule bg-surface">
      <div className="mx-auto max-w-page px-4 py-12">
        {/* Top band: brand + tagline + social */}
        <div className="flex flex-col gap-6 border-b border-rule pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <span className="flex items-center gap-2.5">
              <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-10 w-10" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-h2 font-bold text-ink" lang="ne">
                  {dict.siteName}
                </span>
                <span
                  className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute"
                  lang="en"
                >
                  Nagarik Watch
                </span>
              </span>
            </span>
            <p className="mt-4 text-body text-ink-soft" lang={lang}>
              {dict.tagline}
            </p>
          </div>

          <ul className="flex items-center gap-2">
            <SocialLink
              href="https://facebook.com/nagarikwatch"
              label="Facebook"
              locale={locale}
              path="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h2.5l.5-3H14V9z"
            />
            <SocialLink
              href="https://x.com/nagarikwatch"
              label="X"
              locale={locale}
              path="M18 4l-5 6 5 7h-3l-3-4-3 4H6l5-6-5-7h3l3 4 3-4z"
            />
            <SocialLink
              href="https://youtube.com/@nagarikwatch"
              label="YouTube"
              locale={locale}
              path="M21 8a3 3 0 0 0-2-2C17 5 12 5 12 5s-5 0-7 1a3 3 0 0 0-2 2 30 30 0 0 0 0 8 3 3 0 0 0 2 2c2 1 7 1 7 1s5 0 7-1a3 3 0 0 0 2-2 30 30 0 0 0 0-8zM10 14V9l5 3z"
            />
            <SocialLink
              href="https://t.me/nagarikwatch"
              label="Telegram"
              locale={locale}
              path="M21 4L3 11l5 2 2 6 3-4 5 4z"
            />
            <SocialLink
              href="mailto:contact@nagarikwatch.com"
              label={locale === 'en' ? 'Email' : 'इमेल'}
              locale={locale}
              path="M3 5h18v14H3zM3 6l9 7 9-7"
              noFill
            />
          </ul>
        </div>

        {/* Middle band: 4-column grid */}
        <div className="grid gap-8 py-8 md:grid-cols-2 lg:grid-cols-4">
          <nav aria-label={locale === 'en' ? 'Sections' : 'विभाग'} className="lg:col-span-1">
            <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft" lang={lang}>
              {locale === 'en' ? 'Sections' : 'विभाग'}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {sectionLinks.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="inline-block rounded-md text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    lang={lang}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footerSections} className="lg:col-span-1">
            <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft" lang={lang}>
              {locale === 'en' ? 'About & policy' : 'बारेमा र नीति'}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {aboutLinks.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="inline-block rounded-md text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    lang={lang}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-1">
            <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft" lang={lang}>
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </p>
            <address className="mt-3 not-italic text-body text-ink-soft" lang={lang}>
              <p className="font-semibold text-ink">{PUBLICATION.publisherName}</p>
              <p className="mt-1">{PUBLICATION.address}</p>
              <p className="mt-1">
                <a
                  href={`mailto:${PUBLICATION.email}`}
                  className="rounded-sm transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                >
                  {PUBLICATION.email}
                </a>
              </p>
              <p className="mt-1">{PUBLICATION.phone}</p>
            </address>
            <p className="mt-3 rounded-md border border-rule bg-surface-raised px-3 py-2 text-caption text-ink-soft" lang={lang}>
              <span className="font-semibold uppercase tracking-wide" lang="en">
                {dict.footerRegistration}:
              </span>{' '}
              {registration}
            </p>
          </div>

          <div className="lg:col-span-1">
            <NewsletterInline locale={locale} />
          </div>
        </div>

        {/* Bottom band: legal + ownership */}
        <div className="border-t border-rule pt-6">
          <p className="text-caption text-ink-soft" lang={lang}>
            {dict.footerCopyright(year)}
          </p>
          <p className="mt-2 max-w-3xl text-caption text-mute" lang={lang}>
            {PUBLICATION.ownership}
          </p>
          <p className="mt-2 max-w-3xl text-caption text-mute" lang={lang}>
            {dict.footerDisclaimer}
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  locale,
  path,
  noFill,
}: {
  href: string
  label: string
  locale: Locale
  path: string
  noFill?: boolean
}) {
  return (
    <li>
      <a
        href={href}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        aria-label={label}
        title={label}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint"
        lang={locale === 'en' ? 'en' : 'ne'}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={noFill ? 'none' : 'currentColor'}
          stroke={noFill ? 'currentColor' : 'none'}
          strokeWidth={noFill ? '1.8' : undefined}
          strokeLinecap={noFill ? 'round' : undefined}
          strokeLinejoin={noFill ? 'round' : undefined}
          aria-hidden="true"
          focusable="false"
        >
          <path d={path} />
        </svg>
      </a>
    </li>
  )
}
