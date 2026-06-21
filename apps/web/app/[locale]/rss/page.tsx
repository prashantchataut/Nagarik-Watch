import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <div className="mx-auto max-w-body px-4 py-8" lang={lang}>
      <h1 className="font-display text-display text-ink">
        {locale === 'en' ? 'RSS Feeds' : 'RSS फिड'}
      </h1>
      <p className="mt-4 text-body-lg text-ink-soft">
        {locale === 'en'
          ? 'Use the feeds below for readers, aggregators and newsroom monitoring. Category feeds will be added when CMS taxonomy APIs are live.'
          : 'रीडर, एग्रिगेटर र न्यूजरुम मोनिटरिङका लागि तलका फिड प्रयोग गर्नुहोस्। CMS taxonomy API लाइभ भएपछि विभागगत फिड थपिनेछ।'}
      </p>
      <ul className="mt-6 space-y-3 text-body">
        <li>
          <Link href="/rss.xml" className="font-semibold text-brand">
            /rss.xml
          </Link>
        </li>
        <li>
          <Link href="/news-sitemap.xml" className="font-semibold text-brand">
            /news-sitemap.xml
          </Link>
        </li>
      </ul>
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
    title: locale === 'en' ? 'RSS Feeds' : 'RSS फिड',
    alternates: { canonical: localizeHref(locale, '/rss') },
  }
}
