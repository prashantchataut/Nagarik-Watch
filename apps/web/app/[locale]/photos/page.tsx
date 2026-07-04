import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix } from '@/lib/i18n/locales'


/**
 * Photo gallery / photo stories. Editors add photo stories via the admin
 * (Phase 3: media library). For now, a structured grid with a lightbox-ready
 * layout. The photo list is a server-side constant an admin can edit.
 */
const PHOTOS = [
  { id: 'p1', titleNe: 'काठमाडौँ उपत्यकाको साँझ', captionNe: 'सूर्यास्तमा उपत्यकाको दृश्य।', category: 'society' },
  { id: 'p2', titleNe: 'हिमालयको क्यानभास', captionNe: 'अन्नपूर्ण हिमशृंखलाको दृश्य।', category: 'world' },
  { id: 'p3', titleNe: 'मेला र उत्सव', captionNe: 'स्थानीय मेलामा भिडभाड।', category: 'society' },
  { id: 'p4', titleNe: 'खेलकुदका क्षण', captionNe: 'अन्तर्राष्ट्रिय क्रिकेट प्रतियोगिता।', category: 'sports' },
  { id: 'p5', titleNe: 'विरासत र स्थापत्य', captionNe: 'पाटन दरबार क्षेत्रको स्थापत्य।', category: 'society' },
  { id: 'p6', titleNe: 'ग्रामीण जीवन', captionNe: 'पहाडी गाउँको दैनिक जीवन।', category: 'society' },
  { id: 'p7', titleNe: 'पूर्वाधार विकास', captionNe: 'निर्माणाधीन जलविद्युत आयोजना।', category: 'business' },
  { id: 'p8', titleNe: 'शिक्षा र सिकाइ', captionNe: 'सामुदायिक विद्यालयको कक्षा।', category: 'society' },
]

function placeholderImage(title: string, category: string) {
  const colors: Record<string, { from: string; to: string }> = {
    society: { from: '#8B4513', to: '#C02A2A' },
    world: { from: '#37474F', to: '#546E7A' },
    sports: { from: '#1B5E20', to: '#2E7D32' },
    business: { from: '#1F3A5F', to: '#2E5A8F' },
    default: { from: '#9E1F22', to: '#C02A2A' },
  }
  const c = colors[category] ?? colors.default!
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c.from}"/><stop offset="100%" stop-color="${c.to}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="40" y="560" font-family="sans-serif" font-size="28" font-weight="700" fill="#ffffff" opacity="0.92">${safeTitle}</text><text x="40" y="585" font-family="sans-serif" font-size="14" fill="#ffffff" opacity="0.6" letter-spacing="2">NAGARIK WATCH</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={lang}>{en ? 'Photos' : 'फोटो'}</p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={lang}>{en ? 'Photo Stories' : 'फोटो कथा'}</h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>{en ? 'Photojournalism, visual stories, and galleries.' : 'फोटो पत्रकारिता, दृश्य कथा, र ग्यालरी।'}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PHOTOS.map((photo) => (
          <figure key={photo.id} className="group overflow-hidden rounded-lg border border-rule bg-surface-raised">
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={placeholderImage(photo.titleNe, photo.category)} alt={photo.titleNe} className="h-full w-full object-cover transition-transform duration-slow ease-out-quint group-hover:scale-105" />
            </div>
            <figcaption className="p-4">
              <h2 className="font-display text-body-lg font-semibold text-ink" lang="ne">{photo.titleNe}</h2>
              <p className="mt-1 text-meta text-ink-soft" lang="ne">{photo.captionNe}</p>
            </figcaption>
          </figure>
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
    title: locale === 'en' ? 'Photo Stories' : 'फोटो कथा',
    alternates: { canonical: `${prefix}/photos`, languages: { ne: '/photos', en: '/en/photos' } },
  }
}
