import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { FREE_ARTICLE_SESSION_LIMIT } from '@/lib/free-article-meter'
import type { paywallReason } from '@/lib/paywall/decision'

type PaywallReason = ReturnType<typeof paywallReason>

/**
 * The two gates read differently to a reader, so they say different things.
 * "You have used your five free stories" is answerable — wait, or subscribe.
 * "This one is for members" is not, and pretending otherwise reads as a bait.
 */
export function PaywallNotice({
  locale,
  reason = 'meter-exhausted',
  limit = FREE_ARTICLE_SESSION_LIMIT,
}: {
  locale: Locale
  reason?: PaywallReason
  limit?: number
}) {
  const ne = locale === 'ne'
  const premium = reason === 'premium-article'
  const heading = premium
    ? ne
      ? 'यो लेख सदस्यका लागि हो।'
      : 'This story is for members.'
    : ne
      ? 'पूरा पढ्न सदस्यता चाहिन्छ।'
      : 'Subscribe to continue reading.'
  const body = premium
    ? ne
      ? 'यो लेख सदस्यता भएकाहरूका लागि मात्र हो। सदस्यताबाट पूरा लेख, अभिलेख र उपकरणबीच सुरक्षित समाचार सिङ्क गर्न सकिन्छ।'
      : 'This story is available to members only. A membership includes the full story, archive access and synced saved stories.'
    : ne
      ? `तपाईंले यस सत्रका ${limit} निःशुल्क लेख पढिसक्नुभयो। सदस्यताबाट पूरा लेख, अभिलेख र उपकरणबीच सुरक्षित समाचार सिङ्क गर्न सकिन्छ।`
      : `You have read your ${limit} free stories for this session. A membership includes the full story, archive access and synced saved stories.`

  return (
    <aside
      className="mt-8 border-y border-brand/25 bg-surface-raised px-1 py-6 sm:px-5"
      lang={ne ? 'ne' : 'en'}
      data-paywall-reason={reason}
    >
      <p
        className={
          ne
            ? 'font-display text-meta font-bold tracking-normal text-brand-strong'
            : 'text-meta font-bold uppercase tracking-wide text-brand-strong'
        }
      >
        {ne ? 'सदस्य सामग्री' : 'Member story'}
      </p>
      <h2 className="mt-2 font-display text-h1 leading-tight text-ink">{heading}</h2>
      <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft">{body}</p>
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
