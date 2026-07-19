type HubIndexHeaderProps = {
  kicker: string
  title: string
  lead: string
  lang: 'ne' | 'en'
}

/** Editorial index header shared by latest, trending, search, market, utilities, and live hubs. */
export function HubIndexHeader({ kicker, title, lead, lang }: HubIndexHeaderProps) {
  return (
    <header className="max-w-3xl border-y border-rule py-7" lang={lang}>
      <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">{kicker}</p>
      <h1 className="mt-2 font-display text-display font-extrabold leading-tight text-ink">{title}</h1>
      <p className="mt-3 max-w-body text-body-lg leading-relaxed text-ink-soft">{lead}</p>
    </header>
  )
}
