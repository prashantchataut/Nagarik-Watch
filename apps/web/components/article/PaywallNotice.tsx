import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function PaywallNotice({ locale }: { locale: Locale }) {
  const ne = locale === 'ne'
  return (
    <aside
      className="mt-8 border-y border-brand/25 bg-surface-raised px-1 py-6 sm:px-5"
      lang={ne ? 'ne' : 'en'}
    >
      <p className={ne ? 'font-display text-meta font-bold tracking-normal text-brand-strong' : 'text-meta font-bold uppercase tracking-wide text-brand-strong'}>
        {ne ? 'सदस्य सामग्री' : 'Member story'}
      </p>
      <h2 className="mt-2 font-display text-h1 leading-tight text-ink">
        {ne ? 'पूरा पढ्न सदस्यता चाहिन्छ।' : 'Subscribe to continue reading.'}
      </h2>
      <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft">
        {ne
          ? 'तपाईंले सुरुवाती अंश पढ्नुभयो। सदस्यताबाट पूरा लेख, अभिलेख र उपकरणबीच सुरक्षित समाचार सिङ्क गर्न सकिन्छ।'
          : 'You have reached the free reading limit. A membership includes the full story, archive access and synced saved stories.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={localizeHref(locale, '/membership')}
          className="inline-flex h-11 items-center bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong"
        >
          {ne ? 'सदस्यता हेर्नुहोस्' : 'View membership'}
        </Link>
        <Link
          href={localizeHref(locale, '/auth/login')}
          className="inline-flex h-11 items-center border border-rule px-5 text-body font-bold text-ink hover:border-brand hover:text-brand-strong"
        >
          {ne ? 'पहिले नै सदस्य? लगइन' : 'Already a member? Sign in'}
        </Link>
      </div>
    </aside>
  )
}
