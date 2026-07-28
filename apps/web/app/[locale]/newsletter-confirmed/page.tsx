import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localePrefix } from '@/lib/i18n/locales'

type Params = { locale: string }

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Subscription confirmed - Nagarik Watch',
  description: 'Your Nagarik Watch newsletter subscription is now active.',
  robots: { index: false, follow: false },
}

/**
 * Landing page after a reader confirms their newsletter subscription via the
 * double-opt-in email link. The confirm route (`/api/newsletter/confirm`)
 * redirects to the bare `/newsletter-confirmed`; the locale middleware
 * rewrites that to `/ne/newsletter-confirmed` (or `/en/...`) so this page
 * receives the right locale. Rendered bilingually - confirmation is a
 * transactional moment, not editorial content.
 */
export default async function NewsletterConfirmedPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const home = localePrefix(locale) || '/'

  return (
    <main className="mx-auto max-w-page px-4 py-16">
      <div className="max-w-body border-y border-rule py-10">
        <p className="text-meta font-semibold text-brand-strong" lang="ne">
          न्यूजलेटर
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink" lang="ne">
          सदस्यता पुष्टि भयो
        </h1>
        <p className="mt-3 max-w-md text-body text-ink-soft" lang="ne">
          तपाईं अब नागरिक वाचको न्यूजलेटरमा आवद्ध हुनुभयो। दैनिक डाइजेस्ट र आवश्यक अपडेटहरू
          तपाईंको इनबक्समा पठाइनेछन्।
        </p>
        <p className="mt-4 max-w-md text-body text-ink-soft" lang="en">
          Your subscription is now active. Daily digests and major updates will arrive in your
          inbox.
        </p>
      </div>
      <Link
        href={home}
        className="mt-8 inline-flex min-h-11 items-center justify-center bg-brand px-5 text-body font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2"
        lang="ne"
      >
        गृहपृष्ठमा फर्कनुहोस्
      </Link>
    </main>
  )
}
