type HubIndexHeaderProps = {
  title: string
  /** Prefer short or omit. Long SaaS leads hurt portal indexes. */
  lead?: string
  lang: 'ne' | 'en'
  /** Optional; prefer none. Max one kicker per page. */
  kicker?: string
}

/** Dense index header for category, hub, account, and utility surfaces. */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header className="border-b border-rule pb-3 sm:pb-4" lang={lang}>
      {kicker ? (
        <p className="mb-1 text-meta font-extrabold text-brand-strong">{kicker}</p>
      ) : null}
      <h1 className="font-display text-[clamp(1.45rem,3.2vw,2.1rem)] font-extrabold leading-tight tracking-tight text-ink">
        {title}
      </h1>
      <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      {lead ? (
        <p className="mt-1.5 max-w-[40rem] text-meta leading-relaxed text-ink-soft sm:text-body">
          {lead}
        </p>
      ) : null}
    </header>
  )
}
