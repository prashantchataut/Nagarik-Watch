import type { HomepageSection, Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { SectionHeader } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

type SectionBlockProps = {
  section: HomepageSection
  locale: Locale
  className?: string
}

/**
 * One homepage category band. The layout deliberately varies by content shape rather than
 * repeating an identical grid (impeccable ban on identical-card grids):
 *  - When the section has a lead, the lead is a featured card on the left and the rest
 *    stack as compact text rails on the right (asymmetric editorial mix).
 *  - When there is no lead, the items fall into a uniform default-card grid.
 *
 * The header links through to the category landing page.
 */
export function SectionBlock({ section, locale, className }: SectionBlockProps) {
  const dict = getDictionary(locale)
  const name =
    locale === 'en' && section.category.nameEn ? section.category.nameEn : section.category.nameNe
  const titleLang = locale === 'en' && section.category.nameEn ? 'en' : 'ne'
  const sectionHref = localizeHref(locale, `/${section.category.slug}`)

  if (!section.lead && section.items.length === 0) return null

  const hasLead = Boolean(section.lead)
  const rail = hasLead ? section.items : section.items.slice(1)
  const grid = hasLead ? [] : section.items

  return (
    <section className={className} aria-labelledby={`sec-${section.category.slug}`}>
      <SectionHeader
        title={name}
        locale={locale}
        titleLang={titleLang as Locale}
        href={sectionHref}
        moreLabel={dict.seeAll}
      />
      {hasLead && section.lead ? (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <StoryCard story={section.lead} locale={locale} variant="featured" priority={false} />
          {rail.length > 0 && (
            <ul className="flex flex-col gap-5">
              {rail.map((s) => (
                <li key={s.slug}>
                  <StoryCard story={s} locale={locale} variant="horizontal" />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        grid.length > 0 && (
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((s) => (
              <li key={s.slug}>
                <StoryCard story={s} locale={locale} variant="default" />
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}
