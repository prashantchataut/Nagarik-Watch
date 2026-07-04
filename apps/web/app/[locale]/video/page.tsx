import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { LogoMark } from '@/components/Logo'


/**
 * Video gallery. Editors add video URLs via the admin (Phase 3: media library).
 * For now, this is a structured page that renders a player + thumbnail grid.
 * The video list is a server-side constant that an admin can edit.
 */
const VIDEOS = [
  { id: 'placeholder-1', titleNe: 'संसदको बजेट अधिवेशन: प्रमुख छलफल', youtubeId: '', durationNe: '५:३२' },
  { id: 'placeholder-2', titleNe: 'रेमिट्यान्स प्रवाह विश्लेषण', youtubeId: '', durationNe: '३:१८' },
  { id: 'placeholder-3', titleNe: 'नेपाली क्रिकेट टोलीको तयारी', youtubeId: '', durationNe: '७:४५' },
  { id: 'placeholder-4', titleNe: 'जलवायु परिवर्तन: हिमालयको अवस्था', youtubeId: '', durationNe: '१०:२२' },
  { id: 'placeholder-5', titleNe: 'डिजिटल नेपाल: प्रगति र चुनौती', youtubeId: '', durationNe: '४:०७' },
  { id: 'placeholder-6', titleNe: 'शिक्षा गुणस्तर सुधार पहल', youtubeId: '', durationNe: '६:१५' },
]

export default async function VideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={lang}>{en ? 'Video' : 'भिडियो'}</p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={lang}>{en ? 'Video Gallery' : 'भिडियो ग्यालरी'}</h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>{en ? 'News videos, interviews, explainers, and live embeds.' : 'समाचार भिडियो, अन्तर्वार्ता, व्याख्या, र लाइभ एम्बेड।'}</p>
      </header>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOS.map((v) => (
          <article key={v.id} className="group overflow-hidden rounded-lg border border-rule bg-surface-raised">
            <div className="relative aspect-video bg-ink/5">
              {v.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${v.youtubeId}`}
                  title={v.titleNe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-mute">
                  <LogoMark title="Nagarik Watch" className="h-10 w-10 opacity-30" />
                  <span className="text-caption" lang={lang}>{en ? 'Video coming soon' : 'भिडियो चाँडै'}</span>
                </div>
              )}
              <span className="absolute bottom-2 right-2 rounded bg-ink/80 px-1.5 py-0.5 text-caption font-semibold text-surface" lang="ne">{v.durationNe}</span>
            </div>
            <div className="p-4">
              <h2 className="font-display text-body-lg font-semibold leading-snug text-ink group-hover:text-brand-strong" lang="ne">{v.titleNe}</h2>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Video' : 'भिडियो',
    alternates: { canonical: `${prefix}/video`, languages: { ne: '/video', en: '/en/video' } },
  }
}
