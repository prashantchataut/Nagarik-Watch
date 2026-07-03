import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { SITE_URL, PUBLICATION } from '@/lib/site'
import {
  AdminPageHeader,
  AdminCard,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'सेटिङ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Settings — read-mostly overview. None of these values are editable from
 * apps/web on purpose: site identity, publication registration and
 * provider wiring all live in env vars so they survive redeploys and
 * can't be accidentally changed from a UI. Each AdminCard surfaces the
 * relevant env var name as a code snippet so the founder can find what
 * to set.
 */
export default async function SettingsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const doibSet = Boolean(process.env.NEXT_PUBLIC_DOIB_NUMBER)
  const emailConfigured = Boolean(
    process.env.SMTP_HOST || process.env.EMAIL_SERVER || process.env.RESEND_API_KEY,
  )
  const storageConfigured = Boolean(
    process.env.R2_ACCOUNT_ID || process.env.S3_ENDPOINT || process.env.STORAGE_BUCKET,
  )
  const analyticsConfigured = Boolean(
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_POSTHOG_KEY,
  )
  const adsenseConfigured = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT)

  return (
    <div>
      <AdminPageHeader
        title="सेटिङ"
        subtitle="साइट परिचय, प्रकाशन दर्ता र प्रदायक स्थिति"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site identity */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">साइट परिचय</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            env चरबाट पढिन्छ — UI बाट सम्पादन हुँदैन।
          </p>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide text-ink-soft" lang="ne">
                प्रकाशक नाम
              </dt>
              <dd className="mt-0.5 text-body text-ink" lang="ne">
                {PUBLICATION.publisherName}
              </dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide text-ink-soft" lang="ne">
                साइट URL
              </dt>
              <dd className="mt-0.5">
                <code className="font-mono text-body text-ink" lang="en">{SITE_URL}</code>
                <span className="ml-2 text-caption text-mute" lang="ne">
                  ← <code className="font-mono text-ink-soft" lang="en">NEXT_PUBLIC_SITE_URL</code>
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-caption font-semibold uppercase tracking-wide text-ink-soft" lang="ne">
                सम्पर्क इमेल
              </dt>
              <dd className="mt-0.5 text-body text-ink" lang="en">
                {PUBLICATION.email}
              </dd>
            </div>
          </dl>
        </AdminCard>

        {/* Publication registration */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">प्रकाशन दर्ता</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            प्रेस परिषद् / सूचना विभाग (DoIB) दर्ता।
          </p>
          <div className="mt-4">
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-soft" lang="ne">
              दर्ता नम्बर
            </p>
            {doibSet ? (
              <p className="mt-1 font-display text-h2 text-brand-strong" lang="ne">
                {process.env.NEXT_PUBLIC_DOIB_NUMBER}
              </p>
            ) : (
              <p className="mt-1 inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3 py-1 text-meta text-mute" lang="ne">
                <span className="h-2 w-2 rounded-full bg-mute" aria-hidden="true" />
                विचाराधीन
              </p>
            )}
            <p className="mt-3 text-caption text-mute" lang="ne">
              <code className="font-mono text-ink-soft" lang="en">NEXT_PUBLIC_DOIB_NUMBER</code>{' '}
              नसेट भएसम्म «विचाराधीन» देखिन्छ।
            </p>
          </div>
        </AdminCard>

        {/* Email provider */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">इमेल प्रदायक</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            निमन्त्रणा, न्युजलेटर र सूचनाका लागि।
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                emailConfigured
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
              lang="ne"
            >
              {emailConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
            </span>
            <span className="text-caption text-mute" lang="ne">
              {emailConfigured ? 'इमेल पठाउन सकिन्छ।' : 'इमेल पठाउन सकिँदैन।'}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-caption text-ink-soft" lang="en">
            <li><code className="font-mono text-mute">SMTP_HOST</code></li>
            <li><code className="font-mono text-mute">EMAIL_SERVER</code></li>
            <li><code className="font-mono text-mute">RESEND_API_KEY</code></li>
            <li><code className="font-mono text-mute">NEWSLETTER_API_KEY</code></li>
          </ul>
        </AdminCard>

        {/* Storage provider */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">भण्डारण प्रदायक</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            मिडिया अपलोडका लागि (R2 / S3)।
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                storageConfigured
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
              lang="ne"
            >
              {storageConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
            </span>
            <span className="text-caption text-mute" lang="ne">
              {storageConfigured
                ? 'मिडिया अपलोड सक्षम।'
                : 'अपलोड असक्षम — Unsplash मा आधारित।'}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-caption text-ink-soft" lang="en">
            <li><code className="font-mono text-mute">R2_ACCOUNT_ID</code></li>
            <li><code className="font-mono text-mute">R2_ACCESS_KEY_ID</code></li>
            <li><code className="font-mono text-mute">R2_SECRET_ACCESS_KEY</code></li>
            <li><code className="font-mono text-mute">R2_BUCKET</code></li>
          </ul>
        </AdminCard>

        {/* Analytics */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">एनालिटिक्स</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            पाठक गतिविधि ट्र्याकिङ।
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                analyticsConfigured
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
              lang="ne"
            >
              {analyticsConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
            </span>
            <span className="text-caption text-mute" lang="ne">
              {analyticsConfigured
                ? 'ट्र्याकिङ सक्रिय।'
                : 'कुनै ट्र्याकर जोडिएको छैन।'}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-caption text-ink-soft" lang="en">
            <li><code className="font-mono text-mute">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code></li>
            <li><code className="font-mono text-mute">NEXT_PUBLIC_GA_MEASUREMENT_ID</code></li>
            <li><code className="font-mono text-mute">NEXT_PUBLIC_POSTHOG_KEY</code></li>
          </ul>
        </AdminCard>

        {/* Ads */}
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">विज्ञापन</h2>
          <p className="mt-1 text-caption text-mute" lang="ne">
            AdSense कन्फिगरेसन।
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${
                adsenseConfigured
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
              lang="ne"
            >
              {adsenseConfigured ? 'कन्फिगर भएको' : 'अव्यवस्थित'}
            </span>
            <span className="text-caption text-mute" lang="ne">
              {adsenseConfigured
                ? 'विज्ञापन सक्रिय।'
                : 'विज्ञापन प्लेसमेन्ट निष्क्रिय।'}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-caption text-ink-soft" lang="en">
            <li><code className="font-mono text-mute">NEXT_PUBLIC_ADSENSE_CLIENT</code></li>
          </ul>
          <p className="mt-3 text-caption text-mute" lang="ne">
            विस्तृत व्यवस्थापनका लागि{' '}
            <a href="/admin/ads" className="font-semibold text-brand hover:text-brand-strong" lang="ne">
              विज्ञापन पृष्ठ →
            </a>
          </p>
        </AdminCard>
      </div>
    </div>
  )
}
