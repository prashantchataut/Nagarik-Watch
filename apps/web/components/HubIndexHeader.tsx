type HubIndexHeaderProps = {
  title: string
  lead: string
  lang: 'ne' | 'en'
  /** Optional; prefer none. Max one eyebrow per page. */
  kicker?: string
}

/** Dense newspaper index header for hubs (latest, category, market, etc.). */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header className="border-b-2 border-ink pb-4 pt-2 sm:pb-5" lang={lang}>
      {kicker ? (
        <p className="mb-1.5 text-caption font-extrabold uppercase tracking-[0.1em] text-brand-strong">
          {kicker}
        </p>
      ) : null}
      <h1 className="border-l-4 border-brand pl-3 font-display text-[clamp(1.65rem,3.8vw,2.35rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:pl-4">
        {title}
      </h1>
      <p className="mt-2 max-w-[44rem] pl-3 text-meta leading-relaxed text-ink-soft sm:pl-4 sm:text-body">
        {lead}
      </p>
    </header>
  )
}
