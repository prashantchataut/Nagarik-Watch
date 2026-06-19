import Image from 'next/image'
import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { StoryCard, SectionHeader } from '@nagarikwatch/ui'
import { getAuthor } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

type Params = { locale: string; slug: string }

/**
 * Author profile page. Photo, name (h1), role, bio, and their articles in a grid. The
 * seed authors carry Nepali-primary fields; the English route surfaces the English bio
 * when present. Unknown slug → notFound().
 */
export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const data = await getAuthor(slug)
  if (!data) notFound()

  const { author, stories } = data
  const dict = getDictionary(locale)
  const bio = locale === 'en' ? author.bioEn : author.bioNe
  const roleLabel = roleFor(author.role, locale)

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-start">
        {author.photo && (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full">
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
          <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={locale === 'en' ? 'en' : 'ne'}>
            {roleLabel}
          </p>
          <h1 className="mt-1 font-display text-display text-ink" lang="ne">
            {author.name}
          </h1>
          {bio && (
            <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
              {bio}
            </p>
          )}
        </div>
      </header>

      {stories.items.length === 0 ? (
        <p className="mt-12 text-body-lg text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
          {dict.emptyEnglish}
        </p>
      ) : (
        <section className="mt-8" aria-label={dict.authorStories}>
          <SectionHeader title={dict.authorStories} locale={locale} />
          <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {stories.items.map((s) => (
              <li key={s.slug}>
                <StoryCard story={s} locale={locale} variant="default" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
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
  const data = await getAuthor(slug)
  if (!data) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }
  const opposite = locale === 'en' ? '' : '/en'
  return {
    title: data.author.name,
    alternates: {
      canonical: localizeHref(locale, `/author/${slug}`),
      languages: { ne: `/author/${slug}`, en: `${opposite}/author/${slug}` },
    },
  }
}
