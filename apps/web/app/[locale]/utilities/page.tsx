import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { UtilityDirectory, UtilityPageShell } from '@/components/utilities/UtilityPageShell'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Useful tools' : 'उपयोगी उपकरण',
    description: en
      ? 'Date, language, money and measurement tools that run in your browser.'
      : 'मिति, भाषा, मुद्रा र मापनका उपकरण, ब्राउजरमै चल्ने।',
    alternates: canonicalAlternates(locale, '/utilities'),
  }
}

export default async function UtilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return (
    <UtilityPageShell
      locale={locale}
      title={en ? 'Useful tools for everyday Nepal' : 'दैनिक जीवनका उपयोगी उपकरण'}
      description={
        en
          ? 'Fast, private tools for dates, language, money and measurements. Nothing leaves your browser except optional currency rates.'
          : 'मिति, भाषा, मुद्रा र मापनका छिटो तथा गोप्य उपकरण। मुद्रा दरबाहेक सबै ब्राउजरमै चल्छ।'
      }
    >
      <UtilityDirectory locale={locale} />
    </UtilityPageShell>
  )
}
