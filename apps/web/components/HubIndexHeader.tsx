type HubIndexHeaderProps = {
  title: string
  /** Prefer short or omit. Long SaaS leads hurt portal indexes. */
  lead?: string
  lang: 'ne' | 'en'
  /** Optional; prefer none. Max one kicker per page. */
  kicker?: string
}

/** Compact editorial heading shared by category, topic, province, hub, and utility indexes. */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header lang={lang}>
      {kicker ? <p className="mb-1 text-meta font-extrabold text-brand-strong">{kicker}</p> : null}
      <div className="flex items-start gap-2.5">
        <span className="mt-1 h-7 w-1 bg-brand sm:h-8" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.55rem,3.4vw,2.35rem)] font-extrabold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          {lead ? (
            <p className="mt-1 max-w-[42rem] text-meta leading-relaxed text-ink-soft sm:text-body">
              {lead}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
