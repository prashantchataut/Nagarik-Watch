import type { ReactNode } from 'react'

type InfoPageHeaderProps = {
  /** @deprecated Prefer none; HubIndexHeader-style underline is enough. */
  kicker?: string
  title: string
  lead: string
  lang: 'ne' | 'en'
}

/** Shared page head for static info pages. Matches hub density (no Latin uppercase costume). */
export function InfoPageHeader({ kicker, title, lead, lang }: InfoPageHeaderProps) {
  return (
    <header className="border-b border-rule pb-4 sm:pb-5" lang={lang}>
      {kicker ? (
        <p className="mb-1 text-meta font-extrabold text-brand-strong">{kicker}</p>
      ) : null}
      <h1 className="font-display text-[clamp(1.45rem,3.4vw,2.1rem)] font-extrabold leading-tight tracking-tight text-ink">
        {title}
      </h1>
      <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      <p className="mt-2 max-w-[44rem] text-meta leading-relaxed text-ink-soft sm:text-body">
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

/** A titled prose block under the page header. */
export function InfoSection({ heading, lang, children }: InfoSectionProps) {
  return (
    <section className="max-w-prose border-b border-rule pb-8 last:border-b-0">
      <h2 className="font-display text-h3 font-extrabold text-ink sm:text-h2" lang={lang}>
        {heading}
      </h2>
      <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
      <p className="mt-3 text-body leading-relaxed text-ink-soft sm:text-body-lg">{children}</p>
    </section>
  )
}
