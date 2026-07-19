import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { LogoMark } from '@/components/Logo'
import { NewsletterInline } from '@/components/NewsletterInline'
import { ManageCookiesButton } from '@/components/ManageCookiesButton'
import { PUBLICATION, isPublicPublicationValue } from '@/lib/site'

type FooterProps = {
  locale: Locale
  navCategories?: Category[]
}

export function Footer({ locale, navCategories = [] }: FooterProps) {
  const dict = getDictionary(locale)
  const year = new Date().getFullYear()
  const lang = locale === 'en' ? 'en' : 'ne'
  const registration = PUBLICATION.registrationNumber

  const deskLinks = [
    { href: localizeHref(locale, '/latest'), label: locale === 'en' ? 'Latest' : 'ताजा' },
    { href: localizeHref(locale, '/trending'), label: locale === 'en' ? 'Trending' : 'ट्रेन्डिङ' },
    {
      href: localizeHref(locale, '/most-read'),
      label: locale === 'en' ? 'Most read' : 'धेरै पढिएको',
    },
    {
      href: localizeHref(locale, '/fact-check'),
      label: locale === 'en' ? 'Fact check' : 'तथ्य-जाँच',
    },
    {
      href: localizeHref(locale, '/exclusive'),
      label: locale === 'en' ? 'Exclusive' : 'विशेष',
    },
    { href: localizeHref(locale, '/market'), label: locale === 'en' ? 'Market' : 'बजार' },
    {
      href: localizeHref(locale, '/utilities'),
      label: locale === 'en' ? 'Utilities' : 'उपयोगी सेवा',
    },
    {
      href: localizeHref(locale, '/photos'),
      label: locale === 'en' ? 'Photos' : 'फोटो',
    },
  ]

  const aboutLinks = [
    { href: localizeHref(locale, '/about'), label: dict.footerAbout },
    { href: localizeHref(locale, '/ethics'), label: dict.footerEthics },
    { href: localizeHref(locale, '/privacy'), label: dict.footerPrivacy },
    {
      href: localizeHref(locale, '/cookies'),
      label: locale === 'en' ? 'Cookies' : 'कुकी',
    },
    { href: localizeHref(locale, '/terms'), label: locale === 'en' ? 'Terms' : 'सर्त' },
    { href: localizeHref(locale, '/advertise'), label: locale === 'en' ? 'Advertise' : 'विज्ञापन' },
    { href: localizeHref(locale, '/contact'), label: dict.footerContact },
    { href: '/rss.xml', label: 'RSS' },
  ]

  const categoryLinks = navCategories.slice(0, 12).map((c) => ({
    href: localizeHref(locale, `/${c.slug}`),
    label: locale === 'en' && c.nameEn ? c.nameEn : c.nameNe,
    lang: locale === 'en' && c.nameEn ? 'en' : 'ne',
  }))

  return (
    <footer className="mt-14 border-t-2 border-ink bg-surface pb-20 lg:pb-0">
      <div className="mx-auto max-w-page px-4 py-10">
        <div className="flex flex-col gap-5 border-b border-rule pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <span className="flex items-center gap-3">
              <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-14 w-14" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-h2 font-bold text-ink" lang="ne">
                  {dict.siteName}
                </span>
                <span
                  className="mt-1 text-meta font-black uppercase tracking-[0.16em] text-brand-strong"
                  lang="en"
                >
                  Nagarik Watch
                </span>
              </span>
            </span>
            <p className="mt-4 text-body text-ink-soft" lang={lang}>
              {dict.tagline}
            </p>
            <p className="mt-3 text-meta leading-relaxed text-mute" lang={lang}>
              {locale === 'en'
                ? 'Devanagari-first reporting for Nepal and the Nepali diaspora.'
                : 'नेपाल र नेपाली डायस्पोराका लागि देवनागरी-पहिलो रिपोर्टिङ।'}
            </p>
          </div>

          <ul className="flex items-center gap-2">
            <SocialLink
              href={`mailto:${PUBLICATION.email}`}
              label={locale === 'en' ? 'Email Nagarik Watch' : 'नागरिक वाचलाई इमेल'}
              locale={locale}
              path="M3 5h18v14H3zM3 6l9 7 9-7"
              noFill
            />
          </ul>
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label={locale === 'en' ? 'News sections' : 'समाचार विभाग'}>
            <p className="text-meta font-bold uppercase tracking-wide text-ink" lang={lang}>
              {locale === 'en' ? 'Sections' : 'विभाग'}
            </p>
            <ul className="mt-3 grid gap-y-2">
              {categoryLinks.length > 0
                ? categoryLinks.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="inline-block border-b border-transparent text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
                        lang={s.lang}
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))
                : deskLinks.slice(0, 6).map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="inline-block border-b border-transparent text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
                        lang={lang}
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
            </ul>
          </nav>

          <nav aria-label={locale === 'en' ? 'Desks' : 'डेस्क'}>
            <p className="text-meta font-bold uppercase tracking-wide text-ink" lang={lang}>
              {locale === 'en' ? 'Desks' : 'डेस्क'}
            </p>
            <ul className="mt-3 grid gap-y-2">
              {deskLinks.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="inline-block border-b border-transparent text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
                    lang={lang}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footerSections}>
            <p className="text-meta font-bold uppercase tracking-wide text-ink" lang={lang}>
              {locale === 'en' ? 'About & policy' : 'बारेमा र नीति'}
            </p>
            <ul className="mt-3 grid gap-y-2">
              {aboutLinks.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="inline-block border-b border-transparent text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
                    lang={lang}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-meta font-bold uppercase tracking-wide text-ink" lang={lang}>
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </p>
            <address className="mt-3 not-italic text-body text-ink-soft" lang={lang}>
              <p className="font-semibold text-ink">{PUBLICATION.publisherName}</p>
              {isPublicPublicationValue(PUBLICATION.address) ? (
                <p className="mt-1">{PUBLICATION.address}</p>
              ) : null}
              <p className="mt-1">
                <a
                  href={`mailto:${PUBLICATION.email}`}
                  className="rounded-sm transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                >
                  {PUBLICATION.email}
                </a>
              </p>
              {isPublicPublicationValue(PUBLICATION.phone) ? (
                <p className="mt-1">{PUBLICATION.phone}</p>
              ) : null}
            </address>
            {isPublicPublicationValue(registration) ? (
              <p
                className="mt-3 border border-rule bg-surface-raised px-3 py-2 text-caption text-ink-soft"
                lang={lang}
              >
                <span className="font-semibold uppercase tracking-wide" lang={lang}>
                  {dict.footerRegistration}:
                </span>{' '}
                {registration}
              </p>
            ) : null}
            {isPublicPublicationValue(PUBLICATION.editorInChief) ? (
              <p className="mt-2 text-caption text-mute" lang={lang}>
                {locale === 'en' ? 'Responsible editor' : 'जिम्मेवार सम्पादक'}:{' '}
                {PUBLICATION.editorInChief}
              </p>
            ) : null}
            <div className="mt-5">
              <NewsletterInline locale={locale} />
            </div>
          </div>
        </div>

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
          <div className="mt-3">
            <ManageCookiesButton locale={locale} />
          </div>
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
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint"
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
