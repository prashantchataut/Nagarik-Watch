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
    <header className="border-b-2 border-ink pb-4 pt-1 sm:pb-5" lang={lang}>
      {kicker ? (
        <p className="mb-1 text-caption font-extrabold uppercase tracking-[0.08em] text-brand-strong">
          {kicker}
        </p>
      ) : null}
      <h1 className="font-display text-[clamp(1.5rem,3.5vw,2.15rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="mt-1.5 max-w-[42rem] text-meta leading-relaxed text-ink-soft sm:text-body">
        {lead}
      </p>
    </header>
  )
}
