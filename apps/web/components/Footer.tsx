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

type FooterLink = {
  href: string
  label: string
  lang?: string
}

export function Footer({ locale, navCategories = [] }: FooterProps) {
  const dict = getDictionary(locale)
  const year = new Date().getFullYear()
  const lang = locale === 'en' ? 'en' : 'ne'
  const registration = PUBLICATION.registrationNumber
  const hasEmail = isPublicPublicationValue(PUBLICATION.email)
  const hasAddress = isPublicPublicationValue(PUBLICATION.address)
  const hasPhone = isPublicPublicationValue(PUBLICATION.phone)
  const hasContact = hasEmail || hasAddress || hasPhone

  const deskLinks: FooterLink[] = [
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
    { href: localizeHref(locale, '/exclusive'), label: locale === 'en' ? 'Exclusive' : 'विशेष' },
    { href: localizeHref(locale, '/market'), label: locale === 'en' ? 'Market' : 'बजार' },
    { href: localizeHref(locale, '/utilities'), label: locale === 'en' ? 'Utilities' : 'उपयोगी' },
    { href: localizeHref(locale, '/photos'), label: locale === 'en' ? 'Photos' : 'फोटो' },
    { href: localizeHref(locale, '/province'), label: locale === 'en' ? 'Provinces' : 'प्रदेश' },
  ]

  const policyLinks: FooterLink[] = [
    { href: localizeHref(locale, '/about'), label: dict.footerAbout },
    { href: localizeHref(locale, '/ethics'), label: dict.footerEthics },
    { href: localizeHref(locale, '/privacy'), label: dict.footerPrivacy },
    { href: localizeHref(locale, '/cookies'), label: locale === 'en' ? 'Cookies' : 'कुकी' },
    { href: localizeHref(locale, '/terms'), label: locale === 'en' ? 'Terms' : 'सर्त' },
    { href: localizeHref(locale, '/advertise'), label: locale === 'en' ? 'Advertise' : 'विज्ञापन' },
    { href: localizeHref(locale, '/contact'), label: dict.footerContact },
    { href: localizeHref(locale, '/team'), label: locale === 'en' ? 'Team' : 'टोली' },
    { href: '/rss.xml', label: 'RSS', lang: 'en' },
  ]

  if (hasLivePublicApi()) {
    policyLinks.push(
      {
        href: localizeHref(locale, '/submit-story'),
        label: locale === 'en' ? 'Submit a tip' : 'टिप पठाउनुहोस्',
      },
      {
        href: localizeHref(locale, '/journalist/login'),
        label: locale === 'en' ? 'Reporter desk' : 'पत्रकार डेस्क',
      },
      { href: '/admin/login', label: locale === 'en' ? 'Newsroom' : 'न्युजरुम' },
    )
  }

  const categoryLinks: FooterLink[] = navCategories.slice(0, 14).map((category) => ({
    href: localizeHref(locale, `/${category.slug}`),
    label: locale === 'en' && category.nameEn ? category.nameEn : category.nameNe,
    lang: locale === 'en' && category.nameEn ? 'en' : 'ne',
  }))

  const sections = categoryLinks.length > 0 ? categoryLinks : deskLinks.slice(0, 8)
  const linkClass =
    'inline-flex min-h-8 items-center text-meta font-semibold text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:text-body'

  return (
    <footer className="mt-10 bg-chrome pb-[4.5rem] text-on-chrome lg:pb-5">
      <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,1.28fr)] lg:gap-10">
          <div className="max-w-lg">
            <span className="flex items-center gap-3">
              <LogoMark
                title={`${dict.siteName} / Nagarik Watch`}
                tone="chrome"
                className="h-11 w-11 shrink-0"
              />
              <span className="flex flex-col leading-none">
                <span
                  className="font-display text-[1.45rem] font-extrabold text-on-chrome sm:text-h3"
                  lang="ne"
                >
                  {dict.siteName}
                </span>
                <span className="mt-1 text-caption font-semibold text-brand" lang="en">
                  Nagarik Watch
                </span>
              </span>
            </span>
            <span className="mt-3 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            <p className="mt-2 max-w-md text-meta leading-relaxed text-on-chrome-soft" lang={lang}>
              {dict.tagline}
            </p>
            <p className="mt-2 text-caption font-semibold text-on-chrome-soft" lang={lang}>
              {PUBLICATION.publisherName}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={localizeHref(locale, '/newsletter/archive')}
                className="inline-flex min-h-10 items-center border border-chrome-rule px-3 text-caption font-extrabold text-on-chrome transition-colors hover:border-brand hover:text-brand"
                lang={lang}
              >
                {locale === 'en' ? 'Newsletter archive' : 'न्युजलेटर'}
              </Link>
              <Link
                href={localizeHref(locale, '/contact')}
                className="inline-flex min-h-10 items-center border border-chrome-rule px-3 text-caption font-extrabold text-on-chrome transition-colors hover:border-brand hover:text-brand"
                lang={lang}
              >
                {dict.footerContact}
              </Link>
            </div>

            {hasContact ? (
              <address
                className="mt-4 not-italic text-caption leading-relaxed text-on-chrome-soft"
                lang={lang}
              >
                {hasAddress ? <span className="block">{PUBLICATION.address}</span> : null}
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {hasPhone ? <span>{PUBLICATION.phone}</span> : null}
                  {hasEmail ? (
                    <a
                      href={`mailto:${PUBLICATION.email}`}
                      className="hover:text-on-chrome hover:underline"
                    >
                      {PUBLICATION.email}
                    </a>
                  ) : null}
                </span>
              </address>
            ) : null}
          </div>

          <div>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'News sections' : 'समाचार विभाग'}
            </p>
            <nav aria-label={locale === 'en' ? 'News sections' : 'समाचार विभाग'} className="mt-2.5">
              <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-4">
                {sections.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass} lang={item.lang ?? lang}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-chrome-rule pt-5 sm:grid-cols-2 lg:grid-cols-[0.9fr_1.6fr]">
          <nav aria-label={locale === 'en' ? 'News desks' : 'डेस्क'}>
            <p className="text-caption font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'Desks' : 'डेस्क'}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              {deskLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass} lang={lang}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footerSections}>
            <p className="text-caption font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'About, trust and access' : 'बारेमा, नीति र पहुँच'}
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
              {policyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass} lang={item.lang ?? lang}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-chrome-rule pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl text-caption leading-relaxed text-mute" lang={lang}>
            <p>{dict.footerCopyright(year)}</p>
            <p className="mt-1">{PUBLICATION.ownership}</p>
            <p className="mt-1">{dict.footerDisclaimer}</p>
            {isPublicPublicationValue(registration) ? (
              <p className="mt-1">
                <span className="font-bold text-on-chrome">{dict.footerRegistration}: </span>
                {registration}
              </p>
            ) : null}
            {isPublicPublicationValue(PUBLICATION.editorInChief) ? (
              <p className="mt-1">
                <span className="font-bold text-on-chrome">
                  {locale === 'en' ? 'Responsible editor' : 'जिम्मेवार सम्पादक'}:{' '}
                </span>
                {PUBLICATION.editorInChief}
              </p>
            ) : null}
          </div>
          <div className="shrink-0">
            <ManageCookiesButton locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  )
}
