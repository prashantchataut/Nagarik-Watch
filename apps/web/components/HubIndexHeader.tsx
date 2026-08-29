type HubIndexHeaderProps = {
  title: string
  lead?: string
  lang: 'ne' | 'en'
  kicker?: string
}

export function HubIndexHeader({ title, lead, lang, kicker }: HubIndexHeaderProps) {
  return (
    <header className="hub-index-head mx-auto max-w-[64rem] border-b border-rule pb-7 text-center sm:pb-9" lang={lang}>
      <div className="flex items-center justify-center gap-2.5">
        <span className="h-[2px] w-8 shrink-0 bg-brand" aria-hidden="true" />
        <p className="text-caption font-extrabold text-brand-strong">
          {kicker || (lang === 'en' ? 'Nagarik Watch' : 'नागरिक वाच')}
        </p>
        <span className="h-[2px] w-8 shrink-0 bg-brand" aria-hidden="true" />
      </div>
      <h1
        className={`mx-auto mt-3 max-w-[19ch] text-balance font-display text-[clamp(2.35rem,5vw,4.25rem)] font-black text-ink ${
          lang === 'en' ? 'leading-[1.02] tracking-[-0.035em]' : 'leading-[1.12] tracking-normal'
        }`}
      >
        {title}
      </h1>
      {lead ? (
        <p className="mx-auto mt-3 max-w-[58ch] text-pretty text-body leading-[1.75] text-ink-soft sm:text-body-lg">
          {lead}
        </p>
      ) : null}
    </header>
  )
}
