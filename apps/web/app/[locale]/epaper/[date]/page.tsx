import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getSession } from '@/lib/auth/session'
import { checkEntitlement, listReplicaPages } from '@/lib/epaper'
import { LiveDeskShell } from '@/components/public/LiveDeskShell'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { staticEpaperDateParams } from '@/lib/static-export-params'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const { editions } = await listReplicaPages()
  return staticEpaperDateParams(editions.map((edition) => edition.date))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; date: string }>
}): Promise<Metadata> {
  const { locale: raw, date } = await params
  const locale = asLocale(raw)
  const en = locale === 'en'
  return {
    title: en ? `E-paper ${date}` : `ई-पेपर ${date}`,
    alternates: canonicalAlternates(locale, `/epaper/${date}`),
  }
}

export default async function EpaperViewerPage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>
}) {
  const { locale: raw, date } = await params
  const locale = asLocale(raw)
  const en = locale === 'en'
  const [{ editions }, session] = await Promise.all([
    listReplicaPages(),
    getSession().catch(() => null),
  ])
  const edition = editions.find((item) => item.date === date)
  if (!edition) notFound()

  const visiblePages = []
  for (const page of edition.pages) {
    const check = await checkEntitlement(session, page)
    if (check.allowed) visiblePages.push(page)
  }

  return (
    <LiveDeskShell
      locale={en ? 'en' : 'ne'}
      title={edition.edition}
      dek={new Date(edition.date).toLocaleDateString(en ? 'en-GB' : 'ne-NP')}
      aside={
        <Link
          href={localizeHref(locale, '/epaper')}
          className="text-meta font-semibold text-brand-strong"
        >
          {en ? 'All editions' : 'सबै संस्करण'}
        </Link>
      }
    >
      {visiblePages.length === 0 ? (
        <p className="border-y border-rule py-10 text-body text-ink-soft" lang={en ? 'en' : 'ne'}>
          {en
            ? 'No pages are available for this edition with your current access.'
            : 'तपाईंको हालको पहुँचसँग यो संस्करणका पृष्ठ उपलब्ध छैनन्।'}
        </p>
      ) : (
        <ol className="space-y-10">
          {visiblePages.map((page) => (
            <li key={page.pageNumber}>
              <p className="mb-2 text-meta font-semibold text-ink-soft">
                {en ? `Page ${page.pageNumber}` : `पृष्ठ ${page.pageNumber}`}
              </p>
              <div className="relative aspect-[3/4] w-full max-w-3xl overflow-hidden border border-rule bg-surface-raised">
                <Image
                  src={page.imageUrl}
                  alt={en ? `E-paper page ${page.pageNumber}` : `ई-पेपर पृष्ठ ${page.pageNumber}`}
                  fill
                  className="object-contain"
                  sizes="(min-width: 768px) 48rem, 100vw"
                  unoptimized={page.imageUrl.startsWith('data:')}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </LiveDeskShell>
  )
}
