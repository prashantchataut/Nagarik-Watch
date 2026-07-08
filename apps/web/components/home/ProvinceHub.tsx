import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { PROVINCES } from '@/lib/site'
import { SectionHeader } from '@nagarikwatch/ui'

export function ProvinceHub({ locale, className }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <section className={className} aria-label={lang === 'ne' ? 'प्रदेश' : 'Provinces'}>
      <SectionHeader title={lang === 'ne' ? 'प्रदेश' : 'Provinces'} locale={locale} />
      <div
        className="mt-5 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {PROVINCES.map((p, idx) => {
          const href = localizeHref(locale, `/province/${p.slug}`)
          const name = lang === 'ne' ? p.nameNe : p.nameEn
          const gradients = [
            'from-[#9E1F22] to-[#C02A2A]',
            'from-[#1F3A5F] to-[#2E5A8F]',
            'from-[#1B5E20] to-[#2E7D32]',
            'from-[#4A148C] to-[#6A1B9A]',
            'from-[#BF360C] to-[#E64A19]',
            'from-[#00695C] to-[#00897B]',
            'from-[#37474F] to-[#546E7A]',
          ]
          const gradient = gradients[idx % gradients.length]!
          return (
            <Link
              key={p.slug}
              href={href}
              role="listitem"
              className="group relative flex h-32 w-40 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-lg p-4 no-underline"
              lang={lang}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-slow ease-out-quint group-hover:scale-105`}
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 opacity-[0.08]"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 20%, #ffffff 0, transparent 50%), radial-gradient(circle at 70% 80%, #ffffff 0, transparent 40%)',
                }}
              />
              <div className="relative">
                <p className="font-display text-h2 font-bold text-surface" lang={lang}>
                  {name}
                </p>
              </div>
              <div className="relative flex items-center justify-between">
                <span className="text-caption font-medium text-surface/80" lang={lang}>
                  {lang === 'ne' ? 'समाचार हेर्नुहोस्' : 'View stories'}
                </span>
                <span
                  className="text-surface/70 transition-transform duration-fast ease-out-quint group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
