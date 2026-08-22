type HubIndexHeaderProps = {
  title: string
  /** Keep this factual and short; indexes should scan like publication desks. */
  lead?: string
  lang: 'ne' | 'en'
  /** Optional editorial eyebrow. Max one per page. */
  kicker?: string
}

/**
 * Shared desk header for public indexes. One eyebrow, one headline, one deck:
 * no side-stripe decoration, no dashboard-card chrome, no invented per-route styling.
 */
export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header className="hub-index-head border-b border-rule pb-4 sm:pb-5" lang={lang}>
      <div className="flex items-center gap-2.5">
        <span className="h-[2px] w-8 shrink-0 bg-brand" aria-hidden="true" />
        <p className="text-caption font-extrabold text-brand-strong">
          {kicker || (lang === 'en' ? 'Nagarik Watch' : 'नागरिक वाच')}
        </p>
      </div>
      <h1
        className={`mt-2 max-w-[22ch] text-pretty font-display text-[clamp(2rem,4.6vw,3.5rem)] font-black text-ink ${
          lang === 'en' ? 'leading-[1.04] tracking-[-0.025em]' : 'leading-[1.12] tracking-normal'
        }`}
      >
        {title}
      </h1>
      {lead ? (
        <p className="mt-2.5 max-w-[58ch] text-meta leading-relaxed text-ink-soft sm:text-body">
          {lead}
        </p>
      ) : null}
    </header>
  )
}
