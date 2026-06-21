import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { STATIC_HUBS, TRUST_PAGES } from '@/lib/site'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <h1 className="font-display text-display text-ink">
        {locale === 'en' ? 'Sitemap' : 'साइटम्याप'}
      </h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'News hubs' : 'समाचार खण्ड'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {STATIC_HUBS.map((hub) => (
              <li key={hub.key}>
                <Link href={localizeHref(locale, hub.path)}>
                  {locale === 'en' ? hub.titleEn : hub.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Trust and legal' : 'विश्वास र कानुनी'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {TRUST_PAGES.map((page) => (
              <li key={page.path}>
                <Link href={localizeHref(locale, page.path)}>
                  {locale === 'en' ? page.titleEn : page.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Sitemap' : 'साइटम्याप',
    alternates: { canonical: localizeHref(locale, '/sitemap') },
  }
}
