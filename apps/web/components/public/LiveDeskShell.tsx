import type { ReactNode } from 'react'
import { HubIndexHeader } from '@/components/HubIndexHeader'

type LiveDeskShellProps = {
  locale: 'ne' | 'en'
  title: string
  dek?: string
  kicker?: string
  children: ReactNode
  aside?: ReactNode
}

/** Typographic shell for live desks (sports, scores, alerts). No SaaS card chrome. */
export function LiveDeskShell({ locale, title, dek, kicker, children, aside }: LiveDeskShellProps) {
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader title={title} lead={dek ?? ''} lang={locale} kicker={kicker} />
      <div
        className={
          aside ? 'mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]' : 'mt-8'
        }
      >
        <div className="min-w-0">{children}</div>
        {aside ? (
          <aside className="min-w-0 border-t border-rule pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            {aside}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
