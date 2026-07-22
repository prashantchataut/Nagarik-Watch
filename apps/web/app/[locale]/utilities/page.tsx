import { asLocale } from '@/lib/i18n/locales'
import { UtilityDirectory, UtilityPageShell } from '@/components/utilities/UtilityPageShell'

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
