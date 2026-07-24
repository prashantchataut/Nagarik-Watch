import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getAuthors } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const dynamic = 'force-static'

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const authors = (await getAuthors()).filter((a) => a.isActive)

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader
        title={en ? 'Our team' : 'हाम्रो टोली'}
        lead={
          en
            ? 'Bylined journalists and contributors publishing on Nagarik Watch.'
            : 'नागरिक वाचमा प्रकाशित हुने बाइलिन पत्रकार र योगदानकर्ता।'
        }
        lang={lang}
      />

      {authors.length > 0 ? (
        <ul className="mt-10 divide-y divide-rule border-y border-rule">
          {authors.map((author) => (
            <li key={author.slug} className="py-6">
              <Link
                href={localizeHref(locale, `/author/${author.slug}`)}
                className="group block"
                lang={lang}
              >
                <h2 className="font-display text-h2 text-ink group-hover:text-brand-strong">
                  {author.name}
                </h2>
                <p className="mt-1 text-meta font-semibold text-ink-soft">
                  {en
                    ? author.role
                    : author.role === 'columnist'
                      ? 'स्तम्भकार'
                      : author.role === 'contributor'
                        ? 'योगदानकर्ता'
                        : author.role === 'wire'
                          ? 'वायर'
                          : 'कर्मचारी'}
                </p>
                {(en ? author.bioEn : author.bioNe) ? (
                  <p className="mt-2 max-w-body text-body text-ink-soft">
                    {en ? author.bioEn : author.bioNe}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft" lang={lang}>
          {en ? 'No public author profiles yet.' : 'अहिले सार्वजनिक लेखक प्रोफाइल छैन।'}
        </p>
      )}
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Our team' : 'हाम्रो टोली',
    alternates: { canonical: localizeHref(locale, '/team') },
  }
}
