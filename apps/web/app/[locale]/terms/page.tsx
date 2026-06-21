import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { TrustPolicyPage } from '@/components/TrustPolicyPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { TRUST_PAGES } from '@/lib/site'
const page = TRUST_PAGES.find((item) => item.path === '/terms')!
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  return <TrustPolicyPage locale={locale} {...page} />
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? page.titleEn : page.titleNe,
    alternates: { canonical: localizeHref(locale, page.path) },
  }
}
