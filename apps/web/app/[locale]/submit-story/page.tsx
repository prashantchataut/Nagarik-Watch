import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { ReaderSubmissionForm } from '@/components/forms/ReaderSubmissionForm'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const metadata: Metadata = {
  title: 'Submit a story',
  description: 'Send a verified news tip, PSA, correction or evidence to Nagarik Watch editors.',
}

export default async function SubmitStoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader
        title={ne ? 'समाचार टिप पठाउनुहोस्' : 'Send a news tip'}
        lead={
          ne
            ? 'सबमिसन सिधै प्रकाशन हुँदैन। सम्पादकले प्रमाण, सन्दर्भ र सार्वजनिक हित जाँच्छन्।'
            : 'Submissions are never published automatically. Editors verify evidence, context and public-interest value first.'
        }
        lang={ne ? 'ne' : 'en'}
      />
      <div className="mt-8 border-y border-rule py-6">
        <ReaderSubmissionForm locale={locale} />
      </div>
    </div>
  )
}
