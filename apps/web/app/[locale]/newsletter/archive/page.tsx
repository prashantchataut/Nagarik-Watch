import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { listNewsletterIssues } from '@/lib/newsletter-admin'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

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
            ? 'Previously sent digests and briefings from the newsroom.'
            : 'न्यूजरुमले पहिले पठाएका डाइजेस्ट र संक्षिप्त ब्रिफिङ।'
        }
        lang={en ? 'en' : 'ne'}
      />

      {issues.length === 0 ? (
        <div className="mt-10 border-y border-rule bg-brand-tint/35 px-4 py-8 text-ink-soft">
          <p className="font-display text-h2 text-ink">
            {en ? 'No sent editions yet' : 'अहिलेसम्म पठाइएको संस्करण छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {en
              ? 'This archive will fill after the newsroom sends a newsletter edition.'
              : 'न्यूजरुमले न्यूजलेटर संस्करण पठाएपछि यो संग्रह भरिन थाल्छ।'}
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
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
  )
}
