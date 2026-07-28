import { staticAuthorParams } from '@/lib/static-export-params'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { SectionHeader, StoryGrid } from '@nagarikwatch/ui'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { getAuthor } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticAuthorParams()
}

type Params = { locale: string; slug: string }

/**
 * Author profile page. Photo, name (h1), role, bio, and their articles in a grid. The
 * seed authors carry Nepali-primary fields; the English route surfaces the English bio
 * when present. Unknown slug → notFound().
 */
export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const data = await getAuthor(slug, locale)
  if (!data) notFound()

  const { author, stories } = data
  const dict = getDictionary(locale)
  const bio = locale === 'en' ? author.bioEn : author.bioNe
  const roleLabel = roleFor(author.role, locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  // Unique categories this author has written in, derived from their story list.
  const categories = dedupeCategories(stories.items.map((s) => s.category))

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <div className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-start">
        {author.photo && (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden border-b-4 border-brand">
            <Image
              src={author.photo.url}
              alt={author.photo.alt || author.name}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <HubIndexHeader
            title={author.name}
            lead={
              bio ||
              (locale === 'en'
                ? 'Reporting, analysis and commentary from this desk.'
                : 'यस डेस्कबाट प्रकाशित समाचार, विश्लेषण र टिप्पणी।')
            }
            lang={lang}
            kicker={roleLabel}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-sm bg-brand-tint px-2.5 py-1 text-meta font-bold text-brand-strong"
              lang={lang}
            >
              {dict.storyCount(stories.total)}
            </span>
            {author.social?.twitter && (
              <a
                href={author.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
              >
                X
              </a>
            )}
            {author.social?.facebook && (
              <a
                href={author.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
              >
                Facebook
              </a>
            )}
          </div>
          {categories.length > 0 && (
            <nav aria-label={dict.authorCategories} className="mt-5">
              <p className="text-meta font-semibold text-ink-soft" lang={lang}>
                {dict.authorCategories}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
                  const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
                  return (
                    <li key={c.slug}>
                      <Link
                        href={localizeHref(locale, `/${c.slug}`)}
                        lang={catLang}
                        className="inline-flex items-center border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
        </div>
      </div>

      {stories.items.length === 0 ? (
        <div className="mt-8 border-y border-rule bg-brand-tint/35 px-4 py-8" lang={lang}>
          <p className="font-display text-h2 text-ink">
            {locale === 'en' ? 'No stories yet' : 'अझै समाचार छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {locale === 'en'
              ? 'Published reporting from this author will appear here once it is reviewed.'
              : 'सम्पादकीय समीक्षा पूरा भएपछि यस लेखकका प्रकाशित सामग्री यहाँ देखिनेछन्।'}
          </p>
        </div>
      ) : (
        <section className="mt-8" aria-label={dict.authorStories}>
          <SectionHeader title={dict.authorStories} locale={locale} />
          <div className="mt-6">
            <StoryGrid stories={stories.items} locale={locale} />
          </div>
        </section>
      )}
    </div>
  )
}

function dedupeCategories(cats: CategoryRef[]): CategoryRef[] {
  const seen = new Set<string>()
  const out: CategoryRef[] = []
  for (const c of cats) {
    if (seen.has(c.slug)) continue
    seen.add(c.slug)
    out.push(c)
  }
  return out
}

const ROLE_LABELS = {
  staff: { ne: 'वरिष्ठ पत्रकार', en: 'Staff reporter' },
  columnist: { ne: 'स्तम्भकार', en: 'Columnist' },
  contributor: { ne: 'योगदानकर्ता', en: 'Contributor' },
  wire: { ne: 'समाचार एजेन्सी', en: 'News agency' },
} satisfies Record<string, { ne: string; en: string }>

function roleFor(role: string, locale: Locale): string {
  // Unknown roles fall back to the staff label rather than rendering as undefined.
  const fallback = ROLE_LABELS.staff
  const entry = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? fallback
  return entry[locale]
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const data = await getAuthor(slug, locale)
  if (!data) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }
  return {
    title: data.author.name,
    alternates: {
      canonical: localizeHref(locale, `/author/${slug}`),
      languages: { ne: `/author/${slug}`, en: `/en/author/${slug}` },
    },
  }
}
