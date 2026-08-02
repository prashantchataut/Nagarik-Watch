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
      label: locale === 'en' ? 'Utilities' : 'उपयोगी',
    },
    {
      href: localizeHref(locale, '/photos'),
      label: locale === 'en' ? 'Photos' : 'फोटो',
    },
    {
      href: localizeHref(locale, '/province'),
      label: locale === 'en' ? 'Provinces' : 'प्रदेश',
    },
  ]

  const aboutLinks: { href: string; label: string }[] = [
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
    { href: localizeHref(locale, '/team'), label: locale === 'en' ? 'Team' : 'टोली' },
    { href: '/rss.xml', label: 'RSS' },
  ]

  if (hasLivePublicApi()) {
    aboutLinks.push(
      {
        href: localizeHref(locale, '/submit-story'),
        label: locale === 'en' ? 'Submit a tip' : 'टिप पठाउनुहोस्',
      },
      {
        href: localizeHref(locale, '/journalist/login'),
        label: locale === 'en' ? 'Reporter desk' : 'पत्रकार डेस्क',
      },
      {
        href: '/admin/login',
        label: locale === 'en' ? 'Newsroom' : 'न्युजरुम',
      },
    )
  }

  const categoryLinks = navCategories.slice(0, 14).map((c) => ({
    href: localizeHref(locale, `/${c.slug}`),
    label: locale === 'en' && c.nameEn ? c.nameEn : c.nameNe,
    lang: locale === 'en' && c.nameEn ? 'en' : 'ne',
  }))

  const linkClass =
    'text-meta text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-body'

  return (
    <footer className="mt-8 border-t border-rule bg-chrome text-on-chrome pb-[4.5rem] lg:pb-5">
      <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-7">
        <div className="flex flex-col gap-3 border-b border-chrome-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-md">
            <span className="flex items-center gap-3">
              <LogoMark
                title={`${dict.siteName} / Nagarik Watch`}
                tone="chrome"
                className="h-10 w-10 shrink-0"
              />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[1.35rem] font-extrabold text-on-chrome sm:text-h3" lang="ne">
                  {dict.siteName}
                </span>
                <span className="mt-1 text-caption font-semibold text-brand" lang="en">
                  Nagarik Watch
                </span>
              </span>
            </span>
            <span className="mt-2 block h-0.5 w-10 bg-brand" aria-hidden />
            <p className="mt-2 text-meta leading-relaxed text-on-chrome-soft" lang={lang}>
              {dict.tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPublicPublicationValue(PUBLICATION.email) ? (
              <a
                href={`mailto:${PUBLICATION.email}`}
                className="inline-flex min-h-9 items-center rounded border border-chrome-rule px-3 text-caption font-bold text-on-chrome-soft transition-colors hover:border-brand hover:text-on-chrome"
                lang={lang}
              >
                {PUBLICATION.email}
              </a>
            ) : null}
            <Link
              href={localizeHref(locale, '/newsletter/archive')}
              className="inline-flex min-h-9 items-center rounded border border-chrome-rule px-3 text-caption font-bold text-on-chrome-soft transition-colors hover:border-brand hover:text-on-chrome"
              lang={lang}
            >
              {locale === 'en' ? 'Newsletter' : 'न्युजलेटर'}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <nav aria-label={locale === 'en' ? 'News sections' : 'समाचार विभाग'}>
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'Sections' : 'विभाग'}
            </p>
            <ul className="mt-2.5 columns-1 gap-x-4 sm:columns-2">
              {(categoryLinks.length > 0 ? categoryLinks : deskLinks.slice(0, 8)).map((s) => (
                <li key={s.href} className="mb-1.5 break-inside-avoid">
                  <Link
                    href={s.href}
                    className={linkClass}
                    lang={'lang' in s ? (s.lang as string | undefined) : lang}
                  >
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
            <ul className="mt-2.5 columns-1 gap-x-4 sm:columns-2">
              {deskLinks.map((s) => (
                <li key={s.href} className="mb-1.5 break-inside-avoid">
                  <Link href={s.href} className={linkClass} lang={lang}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={dict.footerSections} className="sm:col-span-2 lg:col-span-1">
            <p className="font-display text-body font-extrabold text-on-chrome" lang={lang}>
              {locale === 'en' ? 'About & policy' : 'बारेमा र नीति'}
            </p>
            <ul className="mt-2.5 columns-1 gap-x-4 sm:columns-2 lg:columns-1">
              {aboutLinks.map((s) => (
                <li key={s.href} className="mb-1.5 break-inside-avoid">
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
            <address className="mt-2.5 not-italic text-meta leading-relaxed text-on-chrome-soft" lang={lang}>
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

        <div className="flex flex-col gap-3 border-t border-chrome-rule pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-caption text-mute" lang={lang}>
              {dict.footerCopyright(year)}
            </p>
            <p className="mt-1.5 text-caption leading-relaxed text-mute" lang={lang}>
              {PUBLICATION.ownership}
            </p>
            <p className="mt-1.5 text-caption leading-relaxed text-mute" lang={lang}>
              {dict.footerDisclaimer}
            </p>
          </div>
          <div className="shrink-0">
            <ManageCookiesButton locale={locale} />
          </div>
        </div>
      </div>
    </footer>
  )
}
