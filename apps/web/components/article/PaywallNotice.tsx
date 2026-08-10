import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function PaywallNotice({ locale }: { locale: Locale }) {
  const ne = locale === 'ne'
  return (
    <aside
      className="mt-8 rounded-2xl border border-brand/25 bg-surface-raised p-6 shadow-card"
      lang={ne ? 'ne' : 'en'}
    >
      <p className="text-meta font-bold uppercase tracking-wide text-brand-strong">
        {ne ? 'सदस्य सामग्री' : 'Member story'}
      </p>
      <h2 className="mt-2 font-display text-h1 leading-tight text-ink">
        {ne ? 'पूरा पढ्न सदस्यता चाहिन्छ।' : 'Subscribe to continue reading.'}
      </h2>
      <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft">
        {ne
          ? 'तपाईंले सुरुवाती अंश पढ्नुभयो। सदस्यता सक्रिय भएपछि पूरा लेख, archive access र saved reading sync उपलब्ध हुन्छ।'
          : 'You have reached the preview limit. Membership unlocks the full article, archive access and synced saved reading.'}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={localizeHref(locale, '/membership')}
          className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong"
        >
          {ne ? 'सदस्यता हेर्नुहोस्' : 'View membership'}
        </Link>
        <Link
          href={localizeHref(locale, '/auth/login')}
          className="inline-flex h-11 items-center rounded-full border border-rule px-5 text-body font-bold text-ink hover:border-brand hover:text-brand-strong"
        >
          {ne ? 'पहिले नै सदस्य? लगइन' : 'Already a member? Sign in'}
        </Link>
      </div>
    </aside>
  )
}
