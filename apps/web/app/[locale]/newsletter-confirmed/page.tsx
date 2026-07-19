import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localePrefix } from '@/lib/i18n/locales'

type Params = { locale: string }

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Subscription confirmed  -  Nagarik Watch',
  description: 'Your Nagarik Watch newsletter subscription is now active.',
  robots: { index: false, follow: false },
}

/**
 * Landing page after a reader confirms their newsletter subscription via the
 * double-opt-in email link. The confirm route (`/api/newsletter/confirm`)
 * redirects to the bare `/newsletter-confirmed`; the locale middleware
 * rewrites that to `/ne/newsletter-confirmed` (or `/en/...`) so this page
 * receives the right locale. Rendered bilingually  -  confirmation is a
 * transactional moment, not editorial content.
 */
export default async function NewsletterConfirmedPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const home = localePrefix(locale) || '/'

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-body flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-brand-strong"
        >
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-display leading-tight text-ink" lang="ne">
        सदस्यता पुष्टि भयो
      </h1>
      <p className="mt-3 max-w-md text-body text-ink-soft" lang="ne">
        तपाईं नागरिक वाचको न्युजलेटरमा सफलतापूर्वक आवद्ध हुनुभयो। दैनिक समाचार पत्र र ब्रेकिंग
        अपडेटहरू अब तपाईंको इनबक्समा पुग्नेछन्। धन्यवाद्!
      </p>
      <p className="mt-1 max-w-md text-meta text-mute">
        You’re now subscribed to the Nagarik Watch newsletter. Daily digest and breaking updates
        will arrive in your inbox.
      </p>
      <Link
        href={home}
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-body font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2"
        lang="ne"
      >
        गृहपृष्ठमा फर्कनुहोस्
      </Link>
    </main>
  )
}
