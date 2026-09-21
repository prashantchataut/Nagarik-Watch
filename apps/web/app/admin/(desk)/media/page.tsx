import Image from 'next/image'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  assertLocalContentAdmin,
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
  payloadCollectionAdminUrl,
} from '@/lib/content/payload-admin-client'
import { assertNewsroomRole, MEDIA_MANAGER_ROLES } from '@/lib/admin-roles'
import { createMediaItem, listMediaItems } from '@/lib/media-library'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  AdminPageHeader,
  AdminCallout,
  AdminButton,
  AdminInput,
  AdminTextarea,
} from '@/components/admin/primitives'
import { MediaUploadForm } from '@/components/admin/MediaUploadForm'
import { assessAltText, auditAltText, type AltTextIssueCode } from '@/lib/a11y/alt-text'

/** Editor-facing wording for each issue the scorer can raise. */
const ALT_ISSUE_NE: Record<AltTextIssueCode, string> = {
  missing: 'Alt text छैन',
  filename: 'फाइलको नाम राखिएको',
  'redundant-prefix': '“तस्बिर:” उपसर्ग हटाउनुहोस्',
  'too-short': 'धेरै छोटो',
  'too-long': 'धेरै लामो — caption मा सार्नुहोस्',
  'duplicates-caption': 'Caption सँग उस्तै',
}

export const metadata: Metadata = { title: 'मिडिया', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function saveMedia(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEDIA_MANAGER_ROLES)
  assertLocalContentAdmin()
  const item = await createMediaItem({
    url: formData.get('url'),
    alt: formData.get('alt'),
    caption: formData.get('caption'),
    credit: formData.get('credit'),
  })
  if (item)
    await recordAuditEvent({
      session,
      action: 'create',
      targetType: 'media',
      targetId: item.id,
      summary: `Media added: ${item.alt}`,
    })
  revalidatePath('/admin/media')
}

export default async function MediaPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEDIA_MANAGER_ROLES)
  if (isPayloadSourceMisconfigured()) redirect('/admin/launch')
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('media'))
  const items = await listMediaItems({ limit: 72 })
  const altAudit = auditAltText(items)
  const persistentStorage = Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    (process.env.CF_WORKERS === '1' &&
      (process.env.STORAGE_PUBLIC_BASE_URL?.trim() || process.env.R2_PUBLIC_BASE_URL?.trim())),
  )

  return (
    <div>
      <AdminPageHeader subtitle="तस्बिर, alt text, caption र credit व्यवस्थापन" />

      {!persistentStorage ? (
        <AdminCallout tone="attention" className="mb-5">
          <p className="text-meta text-ink-soft" lang="ne">
            Persistent media storage कन्फिगर छैन। उत्पादनमा Vercel Blob वा canonical Payload Media
            प्रयोग गर्नुहोस्।
          </p>
        </AdminCallout>
      ) : null}

      {altAudit.failing > 0 || altAudit.weak > 0 ? (
        <AdminCallout tone={altAudit.failing > 0 ? 'danger' : 'attention'} className="mb-5">
          <p className="text-meta text-ink-soft" lang="ne">
            Alt text जाँच: {altAudit.failing} फाइल स्क्रिन रिडरका लागि असफल, {altAudit.weak} कमजोर
            (औसत {Math.round(altAudit.meanScore * 100)}%).
          </p>
          <ul className="mt-2 space-y-1">
            {altAudit.worst.map((entry) => (
              <li key={entry.id} className="text-meta text-ink-soft">
                <span lang="en">{entry.alt || '—'}</span>{' '}
                {entry.assessment.issues.map((issue) => (
                  <span
                    key={issue.code}
                    className={`admin-status admin-status--${
                      issue.severity === 'error' ? 'danger' : 'attention'
                    }`}
                    lang="ne"
                  >
                    {ALT_ISSUE_NE[issue.code]}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </AdminCallout>
      ) : null}

      <div className="admin-media-layout">
        <aside className="admin-media-uploader">
          <div className="admin-media-uploader__head">
            <p lang="ne">नयाँ फाइल</p>
            <h2 lang="ne">मिडिया थप्नुहोस्</h2>
            <span lang="ne">प्रकाशनअघि alt text र credit जाँच गर्नुहोस्।</span>
          </div>
          <form action={saveMedia} className="admin-media-form">
            <AdminInput label="Image URL" name="url" required lang="en" />
            <AdminInput label="Alt text" name="alt" required lang="en" />
            <AdminTextarea label="Caption" name="caption" rows={3} lang="en" />
            <AdminInput label="Credit" name="credit" lang="en" />
            <AdminButton type="submit">URL सुरक्षित गर्नुहोस्</AdminButton>
          </form>
          {persistentStorage ? <MediaUploadForm /> : null}
        </aside>

        <section className="admin-media-library" aria-labelledby="media-library-title">
          <header>
            <div>
              <p lang="ne">{items.length} फाइल</p>
              <h2 id="media-library-title" lang="ne">
                मिडिया लाइब्रेरी
              </h2>
            </div>
          </header>

          {items.length ? (
            <div className="admin-media-grid">
              {items.map((item) => {
                const alt = assessAltText(item.alt, item.caption)
                const worst =
                  alt.issues.find((issue) => issue.severity === 'error') ?? alt.issues[0]
                return (
                  <figure key={item.id} className="admin-media-item">
                    <div className="admin-media-item__image">
                      <Image
                        src={item.url}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <figcaption>
                      <strong>{item.alt}</strong>
                      <span>{item.credit || 'Credit missing'}</span>
                      {worst ? (
                        <span
                          className={`admin-status admin-status--${
                            worst.severity === 'error' ? 'danger' : 'attention'
                          }`}
                          lang="ne"
                        >
                          {ALT_ISSUE_NE[worst.code]}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <p className="admin-section-title" lang="ne">
                मिडिया छैन
              </p>
              <p className="mt-2 text-meta text-ink-soft" lang="ne">
                पहिलो तस्बिर URL वा upload मार्फत थप्नुहोस्।
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
