import { staticProvinceParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicHubPage } from '@/components/PublicHubPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { PROVINCES } from '@/lib/site'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticProvinceParams()
}

function resolveProvince(slug: string) {
  return PROVINCES.find((p) => p.slug === slug)
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const province = resolveProvince(slug)
  const titleNe = province?.nameNe ?? slug.replace(/-/g, ' ')
  const titleEn = province?.nameEn ?? slug.replace(/-/g, ' ')
  return (
    <div>
      <PublicHubPage
        locale={locale}
        hub={{
          key: 'archive',
          path: `/province/${slug}`,
          titleNe,
          titleEn,
          leadNe: `${titleNe} प्रदेशका प्रकाशित सामग्री र स्थानीय अपडेट।`,
          leadEn: `Published stories and local updates from ${titleEn} Province.`,
          mode: 'editorial',
        }}
      />
      <nav
        className="mx-auto max-w-page px-4 pb-12"
        aria-label={locale === 'en' ? 'All provinces' : 'सबै प्रदेश'}
      >
        <ul className="flex flex-wrap gap-2 border-t border-rule pt-6">
          {PROVINCES.map((p) => (
            <li key={p.slug}>
              <Link
                href={localizeHref(locale, `/province/${p.slug}`)}
                className={
                  p.slug === slug
                    ? 'inline-flex min-h-9 items-center border border-brand bg-brand px-3 text-meta font-bold text-surface'
                    : 'inline-flex min-h-9 items-center border border-rule px-3 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong'
                }
                lang={locale === 'en' ? 'en' : 'ne'}
              >
                {locale === 'en' ? p.nameEn : p.nameNe}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const loc = asLocale(locale)
  const province = resolveProvince(slug)
  const title = loc === 'en' ? province?.nameEn ?? slug : province?.nameNe ?? slug
  return {
    title,
    alternates: { canonical: localizeHref(loc, `/province/${slug}`) },
  }
}
