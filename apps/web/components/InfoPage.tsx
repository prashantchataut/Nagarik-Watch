import type { ReactNode } from 'react'

type InfoPageHeaderProps = {
  kicker?: string
  title: string
  lead: string
  lang: 'ne' | 'en'
}

/** Shared publication-style page head for institutional and policy pages. */
export function InfoPageHeader({ kicker, title, lead, lang }: InfoPageHeaderProps) {
  const english = lang === 'en'

  return (
    <header className="border-b border-rule pb-6 sm:pb-8" lang={lang}>
      <span className="mb-4 block h-0.5 w-12 bg-brand" aria-hidden="true" />
      {kicker ? (
        <p
          className={
            english
              ? 'mb-2 text-caption font-extrabold uppercase tracking-[0.06em] text-brand-strong'
              : 'mb-2 font-display text-meta font-extrabold text-brand-strong'
          }
        >
          {kicker}
        </p>
      ) : null}
      <h1
        className={`max-w-[18ch] text-balance font-display text-[clamp(2.15rem,5vw,3.7rem)] font-black leading-[1.08] text-ink ${english ? 'tracking-[-0.025em]' : 'tracking-normal'}`}
      >
        {title}
      </h1>
      <p className="mt-4 max-w-[58ch] text-pretty text-body-lg leading-[1.65] text-ink-soft">
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

/** A readable policy/institutional section with the same rhythm as long-form reporting. */
export function InfoSection({ heading, lang, children }: InfoSectionProps) {
  const english = lang === 'en'

  return (
    <section className="max-w-[72ch] border-b border-rule py-6 first:pt-0 last:border-b-0 sm:py-8">
      <h2
        className={`max-w-[26ch] text-balance font-display text-[clamp(1.45rem,2.4vw,2rem)] font-extrabold leading-tight text-ink ${english ? 'tracking-[-0.015em]' : 'tracking-normal'}`}
        lang={lang}
      >
        {heading}
      </h2>
      <p className="mt-3 text-body-lg leading-[1.72] text-ink-soft">{children}</p>
    </section>
  )
}
