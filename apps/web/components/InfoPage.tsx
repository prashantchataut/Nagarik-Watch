import type { ReactNode } from 'react'

type InfoPageHeaderProps = {
  kicker?: string
  title: string
  lead: string
  lang: 'ne' | 'en'
}

export function InfoPageHeader({ kicker, title, lead, lang }: InfoPageHeaderProps) {
  const english = lang === 'en'

  return (
    <header className="mx-auto max-w-[64rem] border-b border-rule pb-8 text-center sm:pb-10" lang={lang}>
      {kicker ? (
        <p
          className={
            english
              ? 'mb-3 text-caption font-extrabold uppercase tracking-[0.08em] text-brand-strong'
              : 'mb-3 font-display text-meta font-extrabold text-brand-strong'
          }
        >
          {kicker}
        </p>
      ) : null}
      <h1
        className={`mx-auto max-w-[18ch] text-balance font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-black text-ink ${
          english ? 'leading-[1.02] tracking-[-0.035em]' : 'leading-[1.1] tracking-normal'
        }`}
      >
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-[60ch] text-pretty text-body-lg leading-[1.75] text-ink-soft sm:text-[1.2rem]">
        {lead}
      </p>
      <span className="mx-auto mt-6 block h-0.5 w-12 bg-brand" aria-hidden="true" />
    </header>
  )
}

type InfoSectionProps = {
  heading: string
  lang: 'ne' | 'en'
  children: ReactNode
}

export function InfoSection({ heading, lang, children }: InfoSectionProps) {
  const english = lang === 'en'

  return (
    <section className="mx-auto max-w-[68ch] border-b border-rule py-7 first:pt-0 last:border-b-0 sm:py-9">
      <h2
        className={`max-w-[26ch] text-balance font-display text-[clamp(1.55rem,2.5vw,2.15rem)] font-extrabold leading-tight text-ink ${english ? 'tracking-[-0.015em]' : 'tracking-normal'}`}
        lang={lang}
      >
        {heading}
      </h2>
      <div className="mt-3 text-body-lg leading-[1.78] text-ink-soft">{children}</div>
    </section>
  )
}
