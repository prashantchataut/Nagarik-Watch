import type { ReactNode } from 'react'

type InfoPageHeaderProps = {
  kicker: string
  lead: string
  lang: 'ne' | 'en'
}

/**
 * Shared page head for the static info pages (about, ethics, privacy, contact). A small
 * uppercase kicker above an h1 and a lead paragraph, mirroring the category/author header
 * rhythm so the static pages read as part of the same publication.
 */
export function InfoPageHeader({ kicker, lead, lang }: InfoPageHeaderProps) {
  return (
    <header className="border-b border-rule pb-8">
      <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={lang}>
        {kicker}
      </p>
      <h1 className="mt-1 font-display text-display text-ink" lang={lang}>
        {kicker}
      </h1>
      <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft" lang={lang}>
        {lead}
      </p>
    </header>
  )
}

type InfoSectionProps = {
  heading: string
  lang: 'ne' | 'en'
  children: ReactNode
}

/**
 * A titled prose block under the page header. h2 + body paragraph; kept narrow (max-w-prose)
 * so long-form policy copy stays readable on wide screens.
 */
export function InfoSection({ heading, lang, children }: InfoSectionProps) {
  return (
    <section className="max-w-prose">
      <h2 className="font-display text-h2 font-bold text-ink" lang={lang}>
        {heading}
      </h2>
      <p className="mt-3 text-body-lg leading-relaxed text-ink-soft" lang={lang}>
        {children}
      </p>
    </section>
  )
}
