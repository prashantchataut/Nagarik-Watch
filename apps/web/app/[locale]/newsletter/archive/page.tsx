import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { NewsletterInline } from '@/components/NewsletterInline'
import { listNewsletterIssues } from '@/lib/newsletter-admin'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

const EDITION_SECTIONS = {
  en: [
    'The day\u2019s essential reporting in one read',
    'Public-service notices that matter this week',
    'One investigation or data story worth your time',
  ],
  ne: [
    'दिनको मुख्य रिपोर्टिङ एकै पढाइमा',
    'यो हप्ताका महत्त्वपूर्ण सार्वजनिक सूचना',
    'एक खोजमूलक वा तथ्याङ्क कथा',
  ],
} as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Newsletter archive' : 'न्यूजलेटर संग्रह',
    alternates: { canonical: `${SITE_URL}${localizeHref(locale, '/newsletter/archive')}` },
  }
}

export default async function NewsletterArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const issues = (await listNewsletterIssues().catch(() => [])).filter(
    (issue) => issue.status === 'sent',
  )

  return (
    <div className="mx-auto max-w-page px-4 pb-16 pt-10">
      <HubIndexHeader
        title={en ? 'Newsletter archive' : 'न्यूजलेटर संग्रह'}
        lead={
          en
            ? 'A concise daily briefing: the reporting that matters, public-service notices, and one story worth slowing down for.'
            : 'छोटो दैनिक ब्रिफिङ: महत्त्वका रिपोर्टिङ, सार्वजनिक सूचना र एक ध्यान दिन लायक कथा।'
        }
        lang={en ? 'en' : 'ne'}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-10">
        <div className="min-w-0">
          {issues.length === 0 ? (
            <div className="border border-rule bg-surface-raised px-4 py-5" lang={en ? 'en' : 'ne'}>
              <p className="font-display text-h3 font-extrabold text-ink">
                {en ? 'The first edition is in preparation' : 'पहिलो संस्करण तयारीमा छ'}
              </p>
              <p className="mt-2 max-w-[55ch] text-body leading-relaxed text-ink-soft">
                {en
                  ? 'Sent editions are archived here with their full stories. Subscribe below and the briefing arrives in your inbox from day one.'
                  : 'पठाइएका संस्करण यहाँ पूरा कथासहित संग्रहित हुन्छन्। तल सदस्यता लिनुहोस्, पहिलो दिनदेखि ब्रिफिङ इनबक्समा आउँछ।'}
              </p>
              <div className="mt-4 border-t border-rule pt-4">
                <p className="text-caption font-bold text-brand-strong" lang={en ? 'en' : 'ne'}>
                  {en ? 'What each edition carries' : 'हरेक संस्करणमा के आउँछ'}
                </p>
                <ul className="mt-2 grid gap-1.5 text-meta leading-relaxed text-ink-soft" lang={en ? 'en' : 'ne'}>
                  {EDITION_SECTIONS[en ? 'en' : 'ne'].map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-2">
                      <span className="font-bold text-brand" aria-hidden="true">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
              {issues.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={localizeHref(locale, `/newsletter/archive/${issue.id}`)}
                    className="flex min-h-14 items-center justify-between gap-4 py-4 hover:text-brand-strong"
                  >
                    <span className="font-display text-body-lg font-bold">{issue.subject}</span>
                    <time className="shrink-0 text-meta text-mute" dateTime={issue.createdAt}>
                      {new Date(issue.createdAt).toLocaleDateString(en ? 'en-GB' : 'ne-NP')}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="border border-rule bg-surface-raised px-3.5 py-3.5">
            <p className="font-display text-meta font-extrabold text-ink" lang={en ? 'en' : 'ne'}>
              {en ? 'Subscribe' : 'सदस्यता'}
            </p>
            <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
            <div className="mt-3">
              <NewsletterInline locale={locale} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
