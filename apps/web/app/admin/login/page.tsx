import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'
import { LogoMark } from '@/components/Logo'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Newsroom Login',
  description: 'Sign in to the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Newsroom login. Two-column layout modelled on eKantipur's "किन आवद्ध हुने"
 * surface: the left rail sells the value of joining (the four benefit bullets),
 * the right rail carries the credential form. On wide screens both sit side by
 * side; on mobile the benefits stack above the form so the pitch still lands
 * before the ask.
 *
 * Already-signed-in newsroom users are bounced to /admin/dashboard so the login
 * page never traps a sessioned editor.
 */
export default async function AdminLoginPage() {
  let session = null
  try {
    const auth = await getAuth()
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    session = null
  }
  if (session?.user) {
    const role = (session.user as { role?: string }).role ?? 'reader'
    if (role !== 'reader') redirect('/admin/dashboard')
  }

  const benefits = [
    {
      icon: 'digest',
      titleNe: 'समाचार डाइजेस्ट',
      titleEn: 'News Digest',
      bodyNe: 'तपाईले पढ्न छुटाउनुभएका समाचारहरू पढ्न सक्नुहुनेछ।',
      bodyEn: 'Read the stories you missed — every brief, every day.',
    },
    {
      icon: 'saved',
      titleNe: 'संग्रहित समाचार',
      titleEn: 'Saved Stories',
      bodyNe: 'तपाईले संग्रह गर्नुभएको समाचारहरू पढ्न सक्नुहुनेछ।',
      bodyEn: 'Pick up the articles you saved, on any device.',
    },
    {
      icon: 'recommended',
      titleNe: 'प्रस्तावित समाचार',
      titleEn: 'Recommended Stories',
      bodyNe: 'तपाईका रुचि अनुसारका समाचारहरू पढ्न सक्नुहुनेछ।',
      bodyEn: 'Stories picked to match what you actually follow.',
    },
    {
      icon: 'utilities',
      titleNe: 'विविध',
      titleEn: 'Utilities & More',
      bodyNe: 'राशिफल, चलचित्र, विनिमय दर तथा भ्याकेन्सी लगायतका जानकारी प्राप्त गर्न सक्नुहुनेछ।',
      bodyEn: 'Horoscope, cinema, forex rates, vacancies and more — in one place.',
    },
  ]

  return (
    <main className="min-h-screen bg-surface lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* LEFT — the pitch (ekantipur "किन आवद्ध हुने" pattern). */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-surface lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, #ffffff 0, transparent 40%), radial-gradient(circle at 80% 90%, #ffffff 0, transparent 35%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <LogoMark title="नागरिक वाच / Nagarik Watch" className="h-12 w-12" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-h1 font-extrabold" lang="ne">
                नागरिक वाच
              </span>
              <span
                className="mt-0.5 text-meta font-semibold uppercase tracking-[0.18em] text-surface/70"
                lang="en"
              >
                Nagarik Watch
              </span>
            </div>
          </div>

          <p className="mt-12 max-w-md font-display text-h2 leading-tight" lang="ne">
            दैनिक समाचार र विश्लेषणका लागि
            <br />
            <span className="text-surface/85">नागरिक वाचमा आवद्ध हुनुहोस्</span>
          </p>
          <p className="mt-3 max-w-sm text-body text-surface/80" lang="en">
            For daily updates, follow Nagarik Watch — Nepal&rsquo;s civic-minded newsroom.
          </p>
        </div>

        <div className="relative mt-12">
          <p
            className="text-meta font-bold uppercase tracking-wide text-surface/70"
            lang="ne"
          >
            नागरिक वाचमा किन आवद्ध हुने ?
          </p>
          <ul className="mt-5 space-y-4">
            {benefits.map((b) => (
              <li key={b.icon} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/15"
                  aria-hidden="true"
                >
                  <BenefitIcon name={b.icon} />
                </span>
                <div>
                  <p className="font-display text-body-lg font-bold leading-tight" lang="ne">
                    {b.titleNe}
                  </p>
                  <p className="mt-0.5 text-meta text-surface/80" lang="ne">
                    {b.bodyNe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 text-caption text-surface/60" lang="ne">
          © {new Date().getFullYear()} नागरिक वाच मिडिया। सर्वाधिकार सुरक्षित।
        </p>
      </section>

      {/* RIGHT — the form. */}
      <section className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile-only logo lockup (the left rail is hidden on small screens). */}
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <LogoMark title="नागरिक वाच / Nagarik Watch" className="h-11 w-11" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-h1 font-extrabold text-ink" lang="ne">
                नागरिक वाच
              </span>
              <span className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute" lang="en">
                Nagarik Watch
              </span>
            </div>
          </div>

          <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang="en">
            Newsroom Access
          </p>
          <h1 className="mt-1 font-display text-display leading-tight text-ink" lang="ne">
            सम्पादकीय लगइन
          </h1>
          <p className="mt-3 text-body text-ink-soft" lang="ne">
            समाचार सम्पादन, प्रकाशन र कार्यप्रवाहका लागि साइन इन गर्नुहोस्। पाठक खाता भएका प्रयोगकर्ताले{' '}
            <a href="/auth/login" className="font-semibold text-brand underline-offset-2 hover:underline">
              यहाँबाट
            </a>{' '}
            लगइन गर्नुहोस्।
          </p>

          <div className="mt-8">
            <AdminLoginForm />
          </div>

          {/* Mobile-only benefit list (compact) so the pitch isn't lost on phones. */}
          <ul className="mt-10 space-y-3 lg:hidden">
            {benefits.map((b) => (
              <li key={b.icon} className="flex items-start gap-3 rounded-md border border-rule bg-surface-raised p-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint" aria-hidden="true">
                  <BenefitIcon name={b.icon} small />
                </span>
                <div>
                  <p className="font-semibold text-ink" lang="ne">
                    {b.titleNe}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-soft" lang="ne">
                    {b.bodyNe}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

function BenefitIcon({ name, small }: { name: string; small?: boolean }) {
  const size = small ? 14 : 18
  const stroke = 1.8
  switch (name) {
    case 'digest':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16M4 5v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5M8 10h8M8 14h6" />
        </svg>
      )
    case 'saved':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
        </svg>
      )
    case 'recommended':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.5 6.5L21 9l-5 4 1.5 7L12 16l-5.5 4L8 13 3 9l6.5-0.5z" />
        </svg>
      )
    case 'utilities':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    default:
      return null
  }
}
