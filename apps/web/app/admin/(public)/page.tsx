import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

export const metadata: Metadata = {
  title: 'न्युजरुम · नागरिक वाच',
  description: 'Staff entry for the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Staff landing. On the live app host, send editors straight to login.
 * Static Pages export keeps the honest gateway copy.
 */
export default function AdminIndexPage() {
  if (hasLivePublicApi()) {
    redirect('/admin/login')
  }

  const cms =
    process.env.NEXT_PUBLIC_CMS_ADMIN_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim() || ''

  return (
    <main className="newsroom-login newsroom-login--admin mx-auto min-h-[70vh] max-w-xl" lang="ne">
      <div className="newsroom-login__mast">
        <Logo siteName="नागरिक वाच" />
        <span className="newsroom-login__badge">सम्पादकीय</span>
      </div>

      <section className="newsroom-login__brief mt-6">
        <h1>न्युजरुम डेस्क</h1>
        <span className="newsroom-login__brief-rule" aria-hidden="true" />
        <p>
          सार्वजनिक स्थैतिक साइटमा पूर्ण अप्स कन्सोल चल्दैन। सम्पादकीय CMS वा पूर्ण Workers डेप्लोय
          चाहिन्छ।
        </p>
      </section>

      <div className="mt-8 grid gap-3">
        {cms ? (
          <a href={cms} className="newsroom-login-form__submit">
            Payload CMS खोल्नुहोस्
          </a>
        ) : null}
        <Link
          href="/admin/login"
          className="inline-flex min-h-12 items-center justify-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
        >
          अप्स लगइन (यदि सर्भर सक्रिय छ)
        </Link>
        <Link href="/" className="text-meta font-semibold text-brand-strong hover:underline">
          गृहपृष्ठमा फर्कनुहोस्
        </Link>
      </div>
      <p
        className="mt-10 border-t border-rule pt-6 text-meta leading-relaxed text-ink-soft"
        lang="en"
      >
        Set <code className="text-ink">NEXT_PUBLIC_CMS_ADMIN_URL</code> to your Payload admin, or
        deploy the OpenNext Worker build so <code className="text-ink">/admin/login</code> works on
        this domain.
      </p>
    </main>
  )
}
