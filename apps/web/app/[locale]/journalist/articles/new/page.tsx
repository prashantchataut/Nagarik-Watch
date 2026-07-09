import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNavCategories } from '@/lib/content'
import { getSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistArticleDraftForm } from '@/components/journalist/JournalistArticleDraftForm'

export const metadata: Metadata = {
  title: 'New Journalist Article',
  robots: { index: false, follow: false },
}

const CAN_WRITE = new Set(['contributor', 'journalist', 'photo_video_editor', 'assistant_editor', 'sub_editor', 'section_editor', 'province_editor', 'managing_editor', 'editor_in_chief', 'admin', 'super_admin'])

type Params = { locale: string }

export default async function JournalistNewArticle({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  const session = await getSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CAN_WRITE.has(session.role)) redirect(localizeHref(locale, '/journalist/dashboard'))
  const categories = await getNavCategories()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href={localizeHref(locale, '/journalist/dashboard')} className="text-meta font-semibold text-ink-soft hover:text-brand-strong">
        ← {ne ? 'ड्यासबोर्ड' : 'Dashboard'}
      </Link>
      <section className="mt-5 rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={ne ? 'ne' : 'en'}>{ne ? 'सरल लेख सम्पादक' : 'Simplified article editor'}</p>
        <h1 className="mt-2 font-display text-display text-ink" lang={ne ? 'ne' : 'en'}>{ne ? 'ड्राफ्ट तयार गर्नुहोस्' : 'Create a draft'}</h1>
        <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'यो पत्रकारका लागि न्यूनतम लेखन सतह हो: शीर्षक, विभाग, ट्याग, मुख्य तस्वीर र सामग्री। प्रकाशन, SEO र paywall admin panel मा मात्र हुन्छ।' : 'This journalist surface keeps only title, section, tags, hero image and body. Publishing, SEO and paywall controls stay in admin.'}
        </p>
        <JournalistArticleDraftForm locale={locale} categories={categories} />
      </section>
    </main>
  )
}
