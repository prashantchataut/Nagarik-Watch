import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const feeds = [
    {
      href: '/rss.xml',
      titleEn: 'Main RSS feed',
      titleNe: 'मुख्य RSS फिड',
      leadEn: 'Newest published stories across the site.',
      leadNe: 'साइटभरिका नयाँ प्रकाशित समाचार।',
    },
    {
      href: '/news-sitemap.xml',
      titleEn: 'News sitemap',
      titleNe: 'समाचार साइटम्याप',
      leadEn: 'Structured feed for search and newsroom monitoring.',
      leadNe: 'खोज इन्जिन र न्यूजरुम अनुगमनका लागि संरचित फिड।',
    },
  ]
  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <HubIndexHeader
        title={locale === 'en' ? 'RSS feeds' : 'RSS फिड'}
        lead={
          locale === 'en'
            ? 'Feed links for readers, aggregators and newsroom monitoring.'
            : 'रीडर, एग्रिगेटर र न्यूजरुम अनुगमनका लागि फिड लिङ्क।'
        }
        lang={lang}
      />
      <ul className="mt-6 divide-y divide-rule border-y border-rule text-body">
        {feeds.map((feed) => (
          <li key={feed.href} className="py-4">
            <Link
              href={feed.href}
              className="font-display text-h3 text-ink transition-colors hover:text-brand-strong"
            >
              {locale === 'en' ? feed.titleEn : feed.titleNe}
            </Link>
            <p className="mt-1 text-body text-ink-soft">
              {locale === 'en' ? feed.leadEn : feed.leadNe}
            </p>
            <p className="mt-1 text-caption font-semibold text-brand-strong">{feed.href}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-body text-body text-ink-soft">
        {locale === 'en'
          ? 'Category-specific feeds can be added later when taxonomy feed endpoints are ready.'
          : 'विभाग-विशेष फिड taxonomy feed endpoint तयार भएपछि थप्न सकिन्छ।'}
      </p>
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
