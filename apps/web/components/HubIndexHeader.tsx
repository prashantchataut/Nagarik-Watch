type HubIndexHeaderProps = {
  title: string
  lead: string
  lang: 'ne' | 'en'
  /** Optional; prefer none. Max one kicker per page. */
  kicker?: string
}

/** Dense index header for category, hub, account, and utility surfaces. */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
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
