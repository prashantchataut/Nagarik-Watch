'use client'

import { useParams } from 'next/navigation'
import { asLocale } from '@/lib/i18n/locales'
import { PublicErrorState } from '@/components/system/PublicErrorState'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const locale = asLocale(typeof params?.locale === 'string' ? params.locale : 'ne')
  const en = locale === 'en'
  void error

  return (
    <PublicErrorState
      locale={locale}
      code="500"
      title={en ? 'This page could not be loaded' : 'यो पृष्ठ अहिले खुल्न सकेन'}
      body={
        en
          ? 'Try the page again. If the problem continues, the latest desk and homepage remain available.'
          : 'पृष्ठ फेरि प्रयास गर्नुहोस्। समस्या रहे पनि ताजा समाचार र गृहपृष्ठ प्रयोग गर्न सक्नुहुन्छ।'
      }
      onRetry={reset}
    />
  )
}
