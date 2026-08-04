import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export default async function PreetiUnicodeShortcutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  redirect(localizeHref(locale, '/utilities/preeti-unicode'))
}
