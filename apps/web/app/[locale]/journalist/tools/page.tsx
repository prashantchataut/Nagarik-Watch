import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import {
  ADMIN_BASE_ROLES,
  JOURNALIST_DESK_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
  type NewsroomRole,
} from '@/lib/admin-roles'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'Journalist tools', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const TEMPLATES = [
  {
    id: 'spot',
    titleNe: 'स्थलगत समाचार',
    titleEn: 'Spot report',
    body: '## के भयो\n\n[घटनाको मुख्य तथ्य — को, के, कहिले, कहाँ]\n\n## किन महत्त्वपूर्ण\n\n[पाठकलाई किन चासो]\n\n## के भन्छन् सम्बन्धित पक्ष\n\n> [उद्धरण]\n\n## अगाडि के हुन्छ\n\n[अर्को कदम / अनुसन्धान बाँकी]',
  },
  {
    id: 'explain',
    titleNe: 'व्याख्यात्मक',
    titleEn: 'Explainer',
    body: '## प्रश्न\n\n[पाठकको मुख्य प्रश्न]\n\n## छोटो उत्तर\n\n[२–३ वाक्य]\n\n## पृष्ठभूमि\n\n[आवश्यक सन्दर्भ]\n\n## के जाँच गर्नुपर्छ\n\n- [बिन्दु १]\n- [बिन्दु २]',
  },
  {
    id: 'interview',
    titleNe: 'अन्तर्वार्ता ढाँचा',
    titleEn: 'Interview frame',
    body: '## परिचय\n\n[अतिथि को हुन्, किन अहिले]\n\n## प्रश्न १\n\n> उत्तर…\n\n## प्रश्न २\n\n> उत्तर…\n\n## अन्तिम टिप्पणी\n\n[सम्पादकीय नोट — वैकल्पिक]',
  },
] as const

export default async function JournalistToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (ADMIN_BASE_ROLES.has(session.newsroomRole) && !JOURNALIST_DESK_ROLES.has(session.newsroomRole)) {
    redirect('/admin/dashboard')
  }
  if (!JOURNALIST_DESK_ROLES.has(session.newsroomRole as NewsroomRole) && session.newsroomRole !== 'copy_editor' && session.newsroomRole !== 'fact_checker') {
    redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  }
  const roleLabel = ne ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]

  return (
    <JournalistWorkspaceShell
      locale={locale}
      name={session.displayName || session.email}
      roleLabel={roleLabel}
      active="tools"
    >
      <main className="newsroom-page">
        <header className="newsroom-page__header">
          <h1>{ne ? 'लेखन उपकरण' : 'Writing tools'}</h1>
        </header>

        <section className="newsroom-tools-grid">
          <article className="newsroom-tool-card">
            <h2>{ne ? 'शीर्षक चार प्रश्न' : 'Four headline questions'}</h2>
            <ol>
              <li>{ne ? 'के दाबी प्रमाणित छ?' : 'Is the claim verified?'}</li>
              <li>{ne ? 'के अतिरञ्जना छ?' : 'Is it overselling?'}</li>
              <li>{ne ? 'के स्थान/समय स्पष्ट छ?' : 'Are place and time clear?'}</li>
              <li>{ne ? 'के नाम सही हिज्जेमा छ?' : 'Are names spelled correctly?'}</li>
            </ol>
          </article>

          <article className="newsroom-tool-card">
            <h2>{ne ? 'समीक्षामा पठाउनुअघि' : 'Before review'}</h2>
            <ul>
              <li>{ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}</li>
              <li>{ne ? 'स्रोत/प्रमाण नोट (≥२० अक्षर)' : 'Source/evidence note (≥20 chars)'}</li>
              <li>{ne ? 'कम्तीमा एक ट्याग' : 'At least one tag'}</li>
              <li>{ne ? '४०+ शब्दको सामग्री' : '40+ word body'}</li>
            </ul>
          </article>

          <article className="newsroom-tool-card newsroom-tool-card--wide">
            <h2>{ne ? 'ढाँचा — नयाँ ड्राफ्टमा टाँस्नुहोस्' : 'Frames — paste into a new draft'}</h2>
            <div className="newsroom-template-list">
              {TEMPLATES.map((template) => (
                <details key={template.id}>
                  <summary>{ne ? template.titleNe : template.titleEn}</summary>
                  <pre>{template.body}</pre>
                  <Link
                    href={`${localizeHref(locale, '/journalist/articles/new')}?template=${template.id}`}
                    className="newsroom-inline-link"
                  >
                    {ne ? 'यस ढाँचासँग लेख्नुहोस्' : 'Write with this frame'}
                  </Link>
                </details>
              ))}
            </div>
          </article>
        </section>
      </main>
    </JournalistWorkspaceShell>
  )
}
