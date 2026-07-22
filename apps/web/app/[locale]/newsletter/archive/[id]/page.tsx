import { staticNewsletterIssueParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { listNewsletterIssues } from '@/lib/newsletter-admin'
import { SITE_URL } from '@/lib/site'

export function generateStaticParams() {
  return staticNewsletterIssueParams()
}

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale: raw, id } = await params
  const locale = asLocale(raw)
  const issue = (await listNewsletterIssues().catch(() => [])).find(
    (item) => item.id === id && item.status === 'sent',
  )
  if (!issue) return {}
  return {
    title: issue.subject,
    alternates: {
      canonical: `${SITE_URL}${localizeHref(locale, `/newsletter/archive/${id}`)}`,
    },
  }
}

export default async function NewsletterIssuePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: raw, id } = await params
  const locale = asLocale(raw)
  const en = locale === 'en'
  const issue = (await listNewsletterIssues().catch(() => [])).find(
    (item) => item.id === id && item.status === 'sent',
  )
  if (!issue) notFound()

  return (
    <article className="mx-auto max-w-[42rem] px-4 pb-16 pt-10">
      <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
        {en ? 'Newsletter edition' : 'न्यूजलेटर संस्करण'}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-black text-ink">
        {issue.subject}
      </h1>
      <time className="mt-3 block text-meta text-mute" dateTime={issue.createdAt}>
        {new Date(issue.createdAt).toLocaleString(en ? 'en-GB' : 'ne-NP')}
      </time>
      <div className="prose mt-8 whitespace-pre-wrap text-body leading-relaxed text-ink">
        {issue.body}
      </div>
      <p className="mt-10">
        <Link
          href={localizeHref(locale, '/newsletter/archive')}
          className="font-bold text-brand-strong underline-offset-2 hover:underline"
        >
          {en ? 'Back to archive' : 'संग्रहमा फर्कनुहोस्'}
        </Link>
      </p>
    </article>
  )
}
