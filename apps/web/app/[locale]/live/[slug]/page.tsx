import { staticLiveBlogParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getLiveBlogBySlug } from '@/lib/live-blog-admin'
import { liveBlogJsonLd } from '@/lib/json-ld'

export function generateStaticParams() {
  return staticLiveBlogParams()
}

export const revalidate = 60

function formatDate(value?: string, locale = 'ne'): string {
  if (!value) return ' - '
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ne-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kathmandu',
  }).format(new Date(value))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = asLocale(rawLocale)
  const record = await getLiveBlogBySlug(slug)
  if (!record || record.blog.status === 'scheduled') return {}
  return {
    title: locale === 'en' ? record.blog.titleEn || record.blog.titleNe : record.blog.titleNe,
    description:
      locale === 'en'
        ? record.blog.summaryEn || record.blog.summaryNe
        : record.blog.summaryNe,
  }
}

export default async function LiveBlogPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = asLocale(rawLocale)
  const english = locale === 'en'
  const record = await getLiveBlogBySlug(slug)
  if (!record || record.blog.status === 'scheduled') notFound()
  const { blog, updates } = record
  const title = english ? blog.titleEn || blog.titleNe : blog.titleNe
  const summary = english ? blog.summaryEn || blog.summaryNe : blog.summaryNe
  const path = localizeHref(locale, `/live/${blog.slug}`)
  const schema = liveBlogJsonLd({
    title,
    path,
    status: blog.status,
    startedAt: blog.startedAt,
    endedAt: blog.endedAt,
    updates: updates.map((update) => ({
      body: english ? update.bodyEn || update.bodyNe : update.bodyNe,
      createdAt: update.createdAt,
      isKey: update.pinned,
    })),
  })

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="max-w-4xl border-y border-rule py-7" lang={english ? 'en' : 'ne'}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex px-3 py-1 text-caption font-bold ${blog.status === 'live' ? 'bg-brand text-surface' : 'border border-rule text-ink-soft'}`}>
            {blog.status === 'live'
              ? english ? 'LIVE' : 'लाइभ'
              : english ? 'Coverage closed' : 'लाइभ विवरण समाप्त'}
          </span>
          <span className="text-caption text-mute">
            {english ? 'Last updated' : 'अन्तिम अपडेट'}: {formatDate(blog.updatedAt, locale)}
          </span>
        </div>
        <h1 className="mt-4 font-display text-display font-extrabold leading-tight text-ink">{title}</h1>
        {summary ? <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft">{summary}</p> : null}
      </header>

      <section className="mt-8 max-w-4xl" aria-live={blog.status === 'live' ? 'polite' : 'off'}>
        <h2 className="font-display text-h1 text-ink" lang={english ? 'en' : 'ne'}>
          {english ? 'Latest updates' : 'पछिल्ला अपडेट'}
        </h2>
        {updates.length > 0 ? (
          <ol className="mt-4 divide-y divide-rule border-y border-rule">
            {updates.map((update) => {
              const body = english ? update.bodyEn || update.bodyNe : update.bodyNe
              return (
                <li key={update.id} className="grid gap-3 py-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <time dateTime={update.createdAt} className="text-caption font-semibold text-brand-strong">
                    {formatDate(update.createdAt, locale)}
                    {update.pinned ? <span className="mt-1 block text-mute">{english ? 'Key update' : 'मुख्य अपडेट'}</span> : null}
                  </time>
                  <p className="whitespace-pre-line text-body-lg leading-relaxed text-ink" lang={english ? 'en' : 'ne'}>{body}</p>
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="mt-4 border-y border-rule py-8 text-body-lg text-ink-soft" lang={english ? 'en' : 'ne'}>
            {english ? 'The live desk is open. The first verified update will appear here.' : 'लाइभ डेस्क खुलेको छ। पहिलो सत्यापित अपडेट यहाँ देखिनेछ।'}
          </p>
        )}
      </section>
    </div>
  )
}
