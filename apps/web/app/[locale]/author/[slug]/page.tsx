import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
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
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-start">
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
          <p
            className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
            lang={lang}
          >
            {roleLabel}
          </p>
          <h1 className="mt-1 font-display text-display text-ink" lang={lang}>
            {author.name}
          </h1>
          {bio && (
            <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={lang}>
              {bio}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center border-l-2 border-brand pl-3 text-meta font-bold text-brand-strong"
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
                <XIcon /> X
              </a>
            )}
            {author.social?.facebook && (
              <a
                href={author.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
              >
                <FacebookIcon /> Facebook
              </a>
            )}
          </div>
          {categories.length > 0 && (
            <nav aria-label={dict.authorCategories} className="mt-5">
              <p
                className="text-meta font-semibold uppercase tracking-wide text-ink-soft"
                lang={lang}
              >
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
      </header>

      {stories.items.length === 0 ? (
        <p className="mt-12 text-body-lg text-ink-soft" lang={lang}>
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

function XIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
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
