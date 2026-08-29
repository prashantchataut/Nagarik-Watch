import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { NewsletterInline } from '@/components/NewsletterInline'

/**
 * Persistent right rail for index pages. A page may not ship a rail with
 * fewer than two modules (plan rule 1.4) — the newsletter module is always
 * included as the floor.
 */
export function IndexRail({
  locale,
  children,
}: {
  locale: Locale
  children?: ReactNode
}) {
  const en = locale === 'en'
  return (
    <aside className="hidden min-w-0 xl:block" aria-label={en ? 'More from the newsroom' : 'थप सामग्री'}>
      <div className="sticky top-24 space-y-5">
        {children}
        <section className="border-y border-rule py-4">
          <p className="font-display text-meta font-extrabold text-ink" lang={en ? 'en' : 'ne'}>
            {en ? 'Newsletter' : 'न्युजलेटर'}
          </p>
          <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
          <div className="mt-3">
            <NewsletterInline locale={locale} />
          </div>
        </section>
      </div>
    </aside>
  )
}

/** Standard rail module shell for explainer / stats cards. */
export function RailModule({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-y border-rule py-4">
      <p className="font-display text-meta font-extrabold text-ink">{title}</p>
      <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
      <div className="mt-2.5 text-caption leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}
