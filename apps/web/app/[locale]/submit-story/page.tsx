import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { ReaderSubmissionForm } from '@/components/forms/ReaderSubmissionForm'

export const metadata: Metadata = {
  title: 'Submit a story',
  description: 'Send a verified news tip, PSA, correction or evidence to Nagarik Watch editors.',
}

export default async function SubmitStoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <section className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
          Public desk
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,7vw,3.2rem)] font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'समाचार टिप, PSA वा correction पठाउनुहोस्' : 'Send a news tip, PSA or correction'}
        </h1>
        <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'सबमिसन सिधै प्रकाशन हुँदैन। सम्पादकले प्रमाण, सन्दर्भ र सार्वजनिक हित जाँच्छन्।' : 'Submissions are never published automatically. Editors verify evidence, context and public-interest value first.'}
        </p>
      </section>
      <div className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <ReaderSubmissionForm locale={locale} />
      </div>
    </main>
  )
}
