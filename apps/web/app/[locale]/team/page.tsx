import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getAuthors } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const dynamic = 'force-static'

function roleLabel(author: { role: string }, en: boolean): string {
  if (en) return author.role
  if (author.role === 'columnist') return 'स्तम्भकार'
  if (author.role === 'contributor') return 'योगदानकर्ता'
  if (author.role === 'wire') return 'वायर'
  return 'कर्मचारी'
}

function monogram(name: string): string {
  const clean = name.trim()
  return clean ? Array.from(clean).slice(0, 2).join('') : 'ना'
}

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const authors = (await getAuthors().catch(() => [])).filter((a) => a.isActive)
  const staff = authors.filter((a) => a.role !== 'columnist' && a.role !== 'contributor')
  const contributors = authors.filter((a) => a.role === 'columnist' || a.role === 'contributor')

  return (
    <div className="team-page mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader
        title={en ? 'Our team' : 'हाम्रो टोली'}
        lead={
          en
            ? 'Bylined journalists and contributors publishing on Nagarik Watch. Every byline links to the reporter\u2019s full portfolio.'
            : 'नागरिक वाचमा प्रकाशित हुने बाइलिन पत्रकार र योगदानकर्ता। हरेक नाम लेखकको पूरा पोर्टफोलियोमा जोडिएको छ।'
        }
        lang={lang}
      />

      {authors.length > 0 ? (
        <>
          {staff.length > 0 ? (
            <section aria-labelledby="team-staff-title" className="mt-8">
              <h2 id="team-staff-title" className="font-display text-h3 font-extrabold text-ink" lang={lang}>
                {en ? 'Newsroom' : 'समाचार कक्ष'}
              </h2>
              <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
              <ul className="mt-4 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((author) => (
                  <li key={author.slug} className="min-w-0">
                    <Link
                      href={localizeHref(locale, `/author/${author.slug}`)}
                      className="group flex h-full min-w-0 items-start gap-3.5 border border-rule bg-surface-raised px-4 py-4 transition-colors duration-fast ease-out-quint hover:border-brand"
                      lang={lang}
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center bg-brand font-display text-body font-extrabold text-paper"
                        aria-hidden="true"
                      >
                        {monogram(author.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-body-lg font-extrabold text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                          {author.name}
                        </span>
                        <span className="mt-0.5 block text-caption font-semibold text-brand-strong">
                          {roleLabel(author, en)}
                        </span>
                        {(en ? author.bioEn : author.bioNe) ? (
                          <span className="mt-1.5 line-clamp-3 block text-caption leading-relaxed text-ink-soft">
                            {en ? author.bioEn : author.bioNe}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {contributors.length > 0 ? (
            <section aria-labelledby="team-contributors-title" className="mt-9">
              <h2
                id="team-contributors-title"
                className="font-display text-h3 font-extrabold text-ink"
                lang={lang}
              >
                {en ? 'Columnists and contributors' : 'स्तम्भकार र योगदानकर्ता'}
              </h2>
              <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {contributors.map((author) => (
                  <li key={author.slug}>
                    <Link
                      href={localizeHref(locale, `/author/${author.slug}`)}
                      className="inline-flex min-h-10 items-center gap-2.5 border border-rule bg-surface-raised px-3.5 text-meta font-bold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
                      lang={lang}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center bg-brand text-[0.65rem] font-extrabold text-paper"
                        aria-hidden="true"
                      >
                        {monogram(author.name)}
                      </span>
                      {author.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-9 border-t border-rule pt-6" aria-label={en ? 'Editorial standards' : 'सम्पादकीय मापदण्ड'}>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  href: '/ethics',
                  en: 'Ethics policy',
                  ne: 'नैतिक आचारसंहिता',
                  enBody: 'The standards every byline publishes under.',
                  neBody: 'हरेक बाइलिनले पालना गर्ने मापदण्ड।',
                },
                {
                  href: '/corrections-policy',
                  en: 'Corrections',
                  ne: 'सच्याइ नीति',
                  enBody: 'Errors are corrected visibly and dated.',
                  neBody: 'त्रुटि हुँदा खुलेर, मितिसहित सच्याइन्छ।',
                },
                {
                  href: '/contact',
                  en: 'Contact a desk',
                  ne: 'डेस्क सम्पर्क',
                  enBody: 'Tips and corrections reach the right desk.',
                  neBody: 'टिप र सच्याउ अनुरोध सही डेस्कमा पुग्छन्।',
                },
              ].map((item) => (
                <div key={item.href} className="border-t-2 border-brand bg-surface-raised px-4 py-4">
                  <Link
                    href={localizeHref(locale, item.href)}
                    className="font-display text-body font-extrabold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    lang={lang}
                  >
                    {en ? item.en : item.ne} →
                  </Link>
                  <p className="mt-1.5 text-caption leading-relaxed text-ink-soft" lang={lang}>
                    {en ? item.enBody : item.neBody}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
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
