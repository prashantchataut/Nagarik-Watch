import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

export const metadata: Metadata = {
  title: 'न्युजरुम · नागरिक वाच',
  description: 'Staff entry for the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}

/**
 * Staff landing used when the dynamic admin desk is unavailable (static export)
 * or as the honest entry before login. Full ops UI lives under /admin/login when
 * auth APIs are deployed (OpenNext/Workers), or on Payload via NEXT_PUBLIC_CMS_ADMIN_URL.
 */
export default function AdminIndexPage() {
  const cms =
    process.env.NEXT_PUBLIC_CMS_ADMIN_URL?.trim() ||
    process.env.PAYLOAD_ADMIN_URL?.trim() ||
    ''

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-12">
      <Logo siteName="नागरिक वाच" />
      <h1 className="mt-8 font-display text-h1 font-bold tracking-[-0.02em] text-ink" lang="ne">
        न्युजरुम डेस्क
      </h1>
      <p className="mt-3 text-body leading-relaxed text-ink-soft" lang="ne">
        सार्वजनिक स्थैतिक साइटमा पूर्ण अप्स कन्सोल चल्दैन। सम्पादकीय CMS वा पूर्ण Workers
        डेप्लोय चाहिन्छ।
      </p>
      <div className="mt-8 grid gap-3">
        {cms ? (
          <a
            href={cms}
            className="inline-flex min-h-12 items-center justify-center bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
          >
            Payload CMS खोल्नुहोस्
          </a>
        ) : null}
        <Link
          href="/admin/login"
          className="inline-flex min-h-12 items-center justify-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
        >
          अप्स लगइन (यदि सर्भर सक्रिय छ)
        </Link>
        <Link href="/" className="text-meta font-semibold text-brand-strong hover:underline" lang="ne">
          गृहपृष्ठमा फर्कनुहोस्
        </Link>
      </div>
      <p className="mt-10 border-t border-rule pt-6 text-meta leading-relaxed text-ink-soft" lang="en">
        Set <code className="text-ink">NEXT_PUBLIC_CMS_ADMIN_URL</code> to your Payload
        admin, or deploy the OpenNext Worker build so <code className="text-ink">/admin/login</code> works on this domain.
      </p>
    </main>
  )
}
