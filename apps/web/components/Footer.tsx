import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { LogoMark } from '@/components/Logo'
import { ManageCookiesButton } from '@/components/ManageCookiesButton'
import { PUBLICATION, isPublicPublicationValue } from '@/lib/site'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

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
      href: localizeHref(locale, '/editor-picks'),
      label: locale === 'en' ? "Editor's pick" : 'सम्पादकीय छनोट',
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

  const staffLinks = hasLivePublicApi()
    ? [
        {
          href: localizeHref(locale, '/auth/profile'),
          label: locale === 'en' ? 'Your account' : 'खाता',
        },
        {
          href: localizeHref(locale, '/submit-story'),
          label: locale === 'en' ? 'Submit a tip' : 'समाचार पठाउनुहोस्',
        },
        {
          href: localizeHref(locale, '/journalist/login'),
          label: locale === 'en' ? 'Reporter desk' : 'पत्रकार डेस्क',
        },
        {
          href: '/admin/login',
          label: locale === 'en' ? 'Newsroom login' : 'न्युजरुम लगइन',
        },
      ]
    : []

  const categoryLinks = navCategories.slice(0, 12).map((c) => ({
    href: localizeHref(locale, `/${c.slug}`),
    label: locale === 'en' && c.nameEn ? c.nameEn : c.nameNe,
    lang: locale === 'en' && c.nameEn ? 'en' : 'ne',
  }))

  const linkClass =
    'text-body text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong'

  return (
    <footer className="mt-12 border-t border-rule bg-chrome text-on-chrome pb-20 lg:pb-8">
      <div className="mx-auto max-w-page px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-6 border-b border-chrome-rule pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <span className="flex items-center gap-3">
              <LogoMark
                title={`${dict.siteName} / Nagarik Watch`}
                tone="chrome"
                className="h-12 w-12 shrink-0"
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-h3 font-extrabold text-on-chrome" lang="ne">
                  {dict.siteName}
                </span>
                <span className="mt-1 text-caption font-bold text-brand" lang="en">
                  Nagarik Watch
                </span>
              </span>
            </span>
            <span className="mt-3 block h-0.5 w-10 bg-brand" aria-hidden />
            <p className="mt-3 text-meta leading-relaxed text-on-chrome-soft" lang={lang}>
              {dict.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`mailto:${PUBLICATION.email}`}
              className="inline-flex min-h-10 items-center rounded border border-chrome-rule px-3 text-caption font-bold text-on-chrome-soft transition-colors hover:border-brand hover:text-on-chrome"
              lang={lang}
            >
              {PUBLICATION.email}
            </a>
            <Link
              href={localizeHref(locale, '/newsletter/archive')}
              className="inline-flex min-h-10 items-center rounded border border-chrome-rule px-3 text-caption font-bold text-on-chrome-soft transition-colors hover:border-brand hover:text-on-chrome"
              lang={lang}
            >
              {locale === 'en' ? 'Newsletter' : 'न्युजलेटर'}
            </Link>
          </div>
        </div>

        <div
          className={`grid gap-8 py-8 sm:grid-cols-2 ${staffLinks.length > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
        >
          <nav aria-label={locale === 'en' ? 'News sections' : 'समाचार विभाग'}>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'Sections' : 'विभाग'}
            </p>
            <ul className="mt-3 grid gap-y-1.5">
              {categoryLinks.length > 0
                ? categoryLinks.map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className={linkClass} lang={s.lang}>
                        {s.label}
                      </Link>
                    </li>
                  ))
                : deskLinks.slice(0, 6).map((s) => (
                    <li key={s.href}>
                      <Link href={s.href} className={linkClass} lang={lang}>
                        {s.label}
                      </Link>
                    </li>
                  ))}
            </ul>
          </nav>

          <nav aria-label={locale === 'en' ? 'Desks' : 'डेस्क'}>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'Desks' : 'डेस्क'}
            </p>
            <ul className="mt-3 grid gap-y-1.5">
              {deskLinks.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={linkClass} lang={lang}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {staffLinks.length > 0 ? (
            <nav aria-label={locale === 'en' ? 'Account & staff' : 'खाता र स्टाफ'}>
              <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
                {locale === 'en' ? 'Account & staff' : 'खाता र स्टाफ'}
              </p>
              <ul className="mt-3 grid gap-y-1.5">
                {staffLinks.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className={linkClass} lang={lang}>
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-label={dict.footerSections}>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'About & policy' : 'बारेमा र नीति'}
            </p>
            <ul className="mt-3 grid gap-y-1.5">
              {aboutLinks.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={linkClass} lang={lang}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </p>
            <address className="mt-3 not-italic text-meta leading-relaxed text-on-chrome-soft" lang={lang}>
              <p className="font-semibold text-on-chrome">{PUBLICATION.publisherName}</p>
              {isPublicPublicationValue(PUBLICATION.address) ? (
                <p className="mt-1">{PUBLICATION.address}</p>
              ) : null}
              {isPublicPublicationValue(PUBLICATION.phone) ? (
                <p className="mt-1">{PUBLICATION.phone}</p>
              ) : null}
            </address>
            {isPublicPublicationValue(registration) ? (
              <p
                className="mt-3 rounded border border-chrome-rule bg-surface-raised px-3 py-2 text-caption text-on-chrome-soft"
                lang={lang}
              >
                <span className="font-bold text-on-chrome">{dict.footerRegistration}: </span>
                {registration}
              </p>
            ) : null}
            {isPublicPublicationValue(PUBLICATION.editorInChief) ? (
              <p className="mt-2 text-caption text-mute" lang={lang}>
                {locale === 'en' ? 'Responsible editor' : 'जिम्मेवार सम्पादक'}:{' '}
                {PUBLICATION.editorInChief}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-chrome-rule pt-6">
          <p className="text-caption text-mute" lang={lang}>
            {dict.footerCopyright(year)}
          </p>
          <p className="mt-2 max-w-3xl text-caption leading-relaxed text-mute" lang={lang}>
            {PUBLICATION.ownership}
          </p>
          <p className="mt-2 max-w-3xl text-caption leading-relaxed text-mute" lang={lang}>
            {dict.footerDisclaimer}
          </p>
          <div className="mt-4">
            <ManageCookiesButton locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  )
}
