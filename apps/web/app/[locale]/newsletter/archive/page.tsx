import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
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
      <header className="border-b border-rule pb-6">
        <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
          {en ? 'Newsletter' : 'न्यूजलेटर'}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] font-black text-ink">
          {en ? 'Archive' : 'संग्रह'}
        </h1>
        <p className="mt-3 max-w-[40rem] text-body text-ink-soft">
          {en
            ? 'Previously sent digests. Empty until the newsroom queues and sends an edition.'
            : 'पहिले पठाइएका डाइजेस्ट। न्यूजरुमले संस्करण पठाएसम्म खाली रहन्छ।'}
        </p>
      </header>

      {issues.length === 0 ? (
        <p className="mt-10 border-y border-rule py-8 text-ink-soft">
          {en ? 'No sent editions yet.' : 'अहिलेसम्म पठाइएको संस्करण छैन।'}
        </p>
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
