import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { getSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE, type NewsroomRole } from '@/lib/admin-roles'

export const metadata: Metadata = {
  title: 'Journalist Dashboard',
  robots: { index: false, follow: false },
}

const JOURNALIST_ROLES: ReadonlySet<string> = new Set([
  'contributor',
  'journalist',
  'photo_video_editor',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
])

type Params = { locale: string }

export default async function JournalistDashboard({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  const session = await getSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))

  if (!JOURNALIST_ROLES.has(session.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
          <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={ne ? 'ne' : 'en'}>
            {ne ? 'अनुमति चाहिन्छ' : 'Access required'}
          </p>
          <h1 className="mt-2 font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
            {ne ? 'यो पत्रकार डेस्क हो।' : 'This is the journalist desk.'}
          </h1>
          <p className="mt-3 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
            {ne ? 'तपाईंको खातामा पत्रकार वा योगदानकर्ता भूमिका छैन।' : 'Your account does not have a journalist or contributor role.'}
          </p>
          <Link href={localizeHref(locale, '/')} className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-body font-semibold text-surface">
            {ne ? 'गृहपृष्ठमा फर्कनुहोस्' : 'Back to home'}
          </Link>
        </div>
      </main>
    )
  }

  const { items } = await getStories({ locale, perPage: 8 })
  const role = session.role as NewsroomRole
  const roleLabel = ne ? NEWSROOM_ROLE_LABELS_NE[role] : NEWSROOM_ROLE_LABELS_EN[role]

  return (
    <main className="mx-auto max-w-page px-4 py-8">
      <header className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={ne ? 'ne' : 'en'}>
          {ne ? 'पत्रकार डेस्क' : 'Journalist desk'}
        </p>
        <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-display leading-tight text-ink" lang={ne ? 'ne' : 'en'}>
              {ne ? 'स्वागत छ' : 'Welcome'}, {session.displayName || session.email}
            </h1>
            <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>{roleLabel}</p>
          </div>
          <Link href={localizeHref(locale, '/journalist/articles/new')} className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface hover:bg-brand-strong">
            {ne ? 'नयाँ लेख सुरु गर्नुहोस्' : 'Create new article'}
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        {[
          [ne ? 'ड्राफ्ट लेख्नुहोस्' : 'Write drafts', ne ? 'सरल editor बाट ड्राफ्ट सुरक्षित गर्नुहोस्।' : 'Use the simplified editor to save drafts.'],
          [ne ? 'समीक्षामा पठाउनुहोस्' : 'Submit for review', ne ? 'पत्रकारले Draft → Submitted मात्र देख्छ।' : 'Journalists only see Draft → Submitted.'],
          [ne ? 'प्रोफाइल' : 'Profile', session.email],
        ].map(([label, hint]) => (
          <article key={label} className="rounded-xl border border-rule bg-surface-raised p-5">
            <p className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>{label}</p>
            <p className="mt-2 text-caption text-mute" lang={ne ? 'ne' : 'en'}>{hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-rule bg-surface-raised p-6">
        <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>{ne ? 'समाचार सन्दर्भ' : 'Newsroom reference'}</h2>
        <div className="mt-5 divide-y divide-rule">
          {items.map((story) => (
            <Link key={story.slug} href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)} className="block py-4 hover:text-brand-strong">
              <p className="font-display text-body-lg font-semibold text-ink" lang={ne ? 'ne' : 'en'}>{ne ? story.titleNe : story.titleEn || story.titleNe}</p>
              <p className="mt-1 text-caption text-mute">{story.category.nameNe}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
