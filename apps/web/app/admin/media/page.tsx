import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { unsplash } from '@/lib/content/seed/media'
import {
  AdminPageHeader,
  AdminButton,
  AdminEmptyState,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'मिडिया पुस्तकालय',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Media library. Lists every photo available to the newsroom. Today the
 * source is the seed builder (`unsplash(...)` from lib/content/seed/media);
 * when R2 / S3 storage is wired (ADR-003) the same grid will read from the
 * storage provider. Upload is intentionally a styled placeholder — actual
 * object-storage upload requires a provider key (see /admin/settings).
 */
export default async function MediaPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  // Build a representative seed library from the verified Unsplash builder.
  // These are the same photos the seed articles use, so the grid is real
  // (not placeholder grey boxes) without pulling a remote directory listing.
  const media = [
    unsplash('1494891840431-3f878389f1d5', 'संसद् भवनको कक्ष', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1589829085411-6d63ee3e1c3c', 'अदालतको कक्ष', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1526122683487-8d21fd23a5d2', 'पहाडी दृश्य, पूर्वाञ्चल', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1558618666-fcd25c85cd64', 'मतदान प्रक्रिया', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1556122071-e404eaedb77f', 'सडकमा सवारी साधन', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1519494026892-80bbd2d6fd0d', 'अस्पतालको कक्ष', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1551958219-acbc608c6377', 'फुटबल मैदानमा खेलाडी', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1489599849927-2ee91cede3ba', 'चलचित्र देखाउने भवन', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1451187580459-43490279c0fa', 'रातो आकाश, सैन्य विमान', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1528969477-3295c2b6e6c4', 'झण्डाहरू', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1480714378408-67cf0d13bc1b', 'शहरको दृश्य', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
    unsplash('1605164599901-ci44e1a0e3e3', 'परिवार', {
      w: 400,
      h: 300,
      credit: 'Unsplash',
    }),
  ]

  // Derive a friendly filename from the Unsplash URL so editors see a
  // realistic file name, not a raw query string.
  function filename(url: string): string {
    const m = url.match(/photo-([0-9a-f-]+)/)
    return m ? `${m[1]!}.jpg` : url.split('?')[0]!.split('/').pop() ?? 'media.jpg'
  }

  return (
    <div>
      <AdminPageHeader
        title="मिडिया पुस्तकालय"
        subtitle={`कुल ${media.length} वटा मिडिया वस्तु`}
        action={
          <AdminButton disabled title="अपलोडका लागि भण्डारण सेवा कन्फिगर गर्नुहोस्">
            ↑ अपलोड
          </AdminButton>
        }
      />

      {media.length === 0 ? (
        <AdminEmptyState
          title="मिडिया पुस्तकालय खाली छ"
          body="अपलोड बटनबाट तस्बिर थप्नुहोस्। अपलोड सक्षम गर्न पहिले भण्डारण प्रदायक कन्फिगर गर्नुपर्छ।"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m, i) => (
            <li
              key={`${m.url}-${i}`}
              className="group overflow-hidden rounded-lg border border-rule bg-surface-raised"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-fast ease-out-quint group-hover:scale-105"
                  lang="ne"
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate font-display text-meta font-semibold text-ink" lang="ne">
                  {m.alt}
                </p>
                <p className="truncate font-mono text-caption text-mute" lang="en">
                  {filename(m.url)}
                </p>
                <p className="text-caption text-ink-soft" lang="ne">
                  श्रेय: <span className="text-ink">{m.credit ?? '—'}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
