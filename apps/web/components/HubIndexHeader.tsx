type HubIndexHeaderProps = {
  title: string
  lead: string
  lang: 'ne' | 'en'
  /** Optional; prefer none. Max one eyebrow per page. */
  kicker?: string
}

/** Calm editorial index header for hubs (latest, search, market, etc.). */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header className="max-w-2xl border-b border-rule py-5 sm:py-6" lang={lang}>
      {kicker ? (
        <p className="mb-1.5 text-caption font-bold text-ink-soft">{kicker}</p>
      ) : null}
      <h1 className="font-display text-[clamp(1.65rem,4vw,2.35rem)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="mt-2 max-w-body text-body leading-relaxed text-ink-soft">{lead}</p>
    </header>
  )
}
