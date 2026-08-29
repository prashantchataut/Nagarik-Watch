import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { ManageCookiesButton } from '@/components/ManageCookiesButton'
import { PUBLICATION, isPublicPublicationValue } from '@/lib/site'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { patroEntryHref } from '@/lib/calendar-host'

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
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const year = new Date().getFullYear()
  const registration = PUBLICATION.registrationNumber
  const hasEmail = isPublicPublicationValue(PUBLICATION.email)
  const hasAddress = isPublicPublicationValue(PUBLICATION.address)
  const hasPhone = isPublicPublicationValue(PUBLICATION.phone)
  const hasContact = hasEmail || hasAddress || hasPhone

  const categoryLinks: FooterLink[] = navCategories.slice(0, 12).map((category) => ({
    href: localizeHref(locale, `/${category.slug}`),
    label: en && category.nameEn ? category.nameEn : category.nameNe,
    lang: en && category.nameEn ? 'en' : 'ne',
  }))

  const deskLinks: FooterLink[] = [
    { href: localizeHref(locale, '/latest'), label: en ? 'Latest' : 'ताजा' },
    { href: localizeHref(locale, '/trending'), label: en ? 'Trending' : 'ट्रेन्डिङ' },
    { href: localizeHref(locale, '/most-read'), label: en ? 'Most read' : 'धेरै पढिएको' },
    { href: localizeHref(locale, '/editor-picks'), label: en ? "Editor's picks" : 'सम्पादकीय छनोट' },
    { href: localizeHref(locale, '/fact-check'), label: en ? 'Fact check' : 'तथ्य-जाँच' },
    { href: localizeHref(locale, '/exclusive'), label: en ? 'Exclusive' : 'विशेष' },
    { href: localizeHref(locale, '/photos'), label: en ? 'Photos' : 'फोटो' },
    { href: localizeHref(locale, '/video'), label: en ? 'Video' : 'भिडियो' },
  ]

  const utilityLinks: FooterLink[] = [
    { href: patroEntryHref(locale), label: en ? 'Patro' : 'पात्रो' },
    { href: localizeHref(locale, '/market'), label: en ? 'Markets' : 'बजार' },
    { href: localizeHref(locale, '/nepse'), label: 'NEPSE', lang: 'en' },
    { href: localizeHref(locale, '/rashifal'), label: en ? 'Horoscope' : 'राशिफल' },
    { href: localizeHref(locale, '/preeti-unicode'), label: en ? 'Preeti to Unicode' : 'प्रीति–युनिकोड' },
    { href: localizeHref(locale, '/utilities/date-converter'), label: en ? 'Date converter' : 'मिति रूपान्तरण' },
    { href: localizeHref(locale, '/live-scores'), label: en ? 'Live scores' : 'लाइभ स्कोर' },
  ]

  const trustLinks: FooterLink[] = [
    { href: localizeHref(locale, '/about'), label: dict.footerAbout },
    { href: localizeHref(locale, '/help'), label: en ? 'Help' : 'सहायता' },
    { href: localizeHref(locale, '/team'), label: en ? 'Team' : 'टोली' },
    { href: localizeHref(locale, '/editorial-policy'), label: en ? 'Editorial policy' : 'सम्पादकीय नीति' },
    { href: localizeHref(locale, '/corrections-policy'), label: en ? 'Corrections' : 'सच्याइ नीति' },
    { href: localizeHref(locale, '/ethics'), label: dict.footerEthics },
    { href: localizeHref(locale, '/privacy'), label: dict.footerPrivacy },
    { href: localizeHref(locale, '/cookies'), label: en ? 'Cookies' : 'कुकी' },
    { href: localizeHref(locale, '/terms'), label: en ? 'Terms' : 'सर्त' },
    { href: localizeHref(locale, '/advertise'), label: en ? 'Advertise' : 'विज्ञापन' },
    { href: localizeHref(locale, '/contact'), label: dict.footerContact },
    { href: '/rss.xml', label: 'RSS', lang: 'en' },
  ]

  if (hasLivePublicApi()) {
    trustLinks.push(
      { href: localizeHref(locale, '/submit-story'), label: en ? 'Send a tip' : 'टिप पठाउनुहोस्' },
      { href: localizeHref(locale, '/journalist/login'), label: en ? 'Reporter desk' : 'पत्रकार डेस्क' },
    )
  }

  const sections = categoryLinks.length > 0 ? categoryLinks : deskLinks
  const linkClass =
    'inline-flex min-h-9 items-center text-meta font-semibold leading-snug text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

  return (
    <footer className="mt-12 bg-chrome pb-[4.5rem] text-on-chrome lg:pb-0">
      <div className="mx-auto max-w-page px-3 py-7 sm:px-4 sm:py-9">
        <div className="grid gap-8 border-b border-chrome-rule pb-8 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="max-w-xl">
            <Logo siteName={dict.siteName} tone="chrome" className="max-w-[18rem]" />
            <p className="mt-4 max-w-md text-body leading-relaxed text-on-chrome-soft" lang={lang}>
              {dict.tagline}
            </p>
            <p className="mt-2 text-caption font-semibold text-on-chrome-soft" lang={lang}>
              {PUBLICATION.publisherName}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={localizeHref(locale, '/newsletter/archive')}
                className="inline-flex min-h-10 items-center bg-brand px-3.5 text-caption font-extrabold text-paper transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={lang}
              >
                {en ? 'Newsletter' : 'न्युजलेटर'}
              </Link>
              <Link
                href={localizeHref(locale, '/advertise')}
                className="inline-flex min-h-10 items-center border border-chrome-rule px-3.5 text-caption font-extrabold text-on-chrome transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={lang}
              >
                {en ? 'Advertise with us' : 'विज्ञापन दिनुहोस्'}
              </Link>
            </div>

            {hasContact ? (
              <address className="mt-5 not-italic text-caption leading-relaxed text-on-chrome-soft" lang={lang}>
                {hasAddress ? <span className="block">{PUBLICATION.address}</span> : null}
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {hasPhone ? <span>{PUBLICATION.phone}</span> : null}
                  {hasEmail ? (
                    <a href={`mailto:${PUBLICATION.email}`} className="hover:text-on-chrome hover:underline">
                      {PUBLICATION.email}
                    </a>
                  ) : null}
                </span>
              </address>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
            <FooterGroup label={en ? 'Sections' : 'समाचार'} links={sections} linkClass={linkClass} lang={lang} />
            <FooterGroup label={en ? 'Useful' : 'उपयोगी'} links={utilityLinks} linkClass={linkClass} lang={lang} />
            <FooterGroup label={en ? 'Trust & access' : 'विश्वास र पहुँच'} links={trustLinks} linkClass={linkClass} lang={lang} />
          </div>
        </div>

        <div className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="max-w-4xl text-caption leading-relaxed text-mute" lang={lang}>
            <p>{dict.footerCopyright(year)}</p>
            <p className="mt-1">{PUBLICATION.ownership}</p>
            {isPublicPublicationValue(registration) ? (
              <p className="mt-1">
                <span className="font-bold text-on-chrome">{dict.footerRegistration}: </span>
                {registration}
              </p>
            ) : null}
            {isPublicPublicationValue(PUBLICATION.editorInChief) ? (
              <p className="mt-1">
                <span className="font-bold text-on-chrome">{en ? 'Responsible editor' : 'जिम्मेवार सम्पादक'}: </span>
                {PUBLICATION.editorInChief}
              </p>
            ) : null}
            <p className="mt-1">{dict.footerDisclaimer}</p>
          </div>
          <ManageCookiesButton locale={locale} />
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({
  label,
  links,
  linkClass,
  lang,
}: {
  label: string
  links: FooterLink[]
  linkClass: string
  lang: string
}) {
  return (
    <nav aria-label={label}>
      <p className="mb-2.5 font-display text-body font-extrabold text-on-chrome" lang={lang}>
        {label}
      </p>
      <ul className="space-y-0.5">
        {links.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link href={item.href} className={linkClass} lang={item.lang ?? lang}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
