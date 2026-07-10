import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = { title: 'Newsroom Login', description: 'Staff-only sign in to the Nagarik Watch newsroom.', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  try {
    const auth = await getAuth()
    const session = await auth.api.getSession({ headers: await headers() })
    const role = (session?.user as { role?: string } | undefined)?.role
    if (session?.user && role && role !== 'reader') redirect('/admin/dashboard')
  } catch {}

  return <main className="auth-shell">
    <section className="auth-editorial" aria-label="Newsroom introduction">
      <a href="/" className="relative z-10 w-fit" aria-label="Nagarik Watch home"><Logo siteName="नागरिक वाच" /></a>
      <div className="relative z-10 max-w-xl">
        <p className="text-meta font-extrabold uppercase tracking-[.16em] text-[oklch(0.82_0.09_28)]" lang="en">Nagarik Watch newsroom</p>
        <h1 className="mt-5 font-display text-[clamp(2.7rem,5vw,4.8rem)] font-extrabold leading-[.98] text-[oklch(0.97_0.005_28)]" lang="ne">समाचारलाई प्रमाण, सन्दर्भ र जिम्मेवारीसँग प्रकाशित गर्नुहोस्।</h1>
        <p className="mt-6 max-w-lg text-body-lg leading-relaxed text-[oklch(0.82_0.012_28)]" lang="ne">सम्पादक, पत्रकार र प्रकाशन टोलीका लागि सुरक्षित कार्यक्षेत्र। पाठक खाता र न्युजरुम पहुँच अलग राखिएको छ।</p>
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[oklch(0.5_0.035_28)] pt-6 text-meta text-[oklch(0.82_0.012_28)]" lang="ne">
        <p><strong className="block text-[oklch(0.97_0.005_28)]">सम्पादकीय कार्यप्रवाह</strong> ड्राफ्टदेखि प्रकाशनसम्म</p>
        <p><strong className="block text-[oklch(0.97_0.005_28)]">उत्तरदायित्व</strong> भूमिका र अडिट इतिहास</p>
      </div>
    </section>
    <section className="auth-form-column">
      <div className="auth-form-wrap">
        <a href="/" className="mb-10 block w-fit lg:hidden"><Logo siteName="नागरिक वाच" /></a>
        <p className="admin-eyebrow" lang="en">Staff access</p>
        <h2 className="mt-2 font-display text-[2.35rem] font-extrabold leading-tight text-ink" lang="ne">न्युजरुममा प्रवेश</h2>
        <p className="mt-3 max-w-md text-body leading-relaxed text-ink-soft" lang="ne">तपाईंको संस्थागत इमेल र पासवर्ड प्रयोग गर्नुहोस्। पहुँच तपाईंको भूमिकाअनुसार सीमित हुन्छ।</p>
        <div className="auth-form-surface"><AdminLoginForm /></div>
        <p className="mt-8 text-caption text-mute" lang="ne">पाठक हुनुहुन्छ? <a href="/ne/auth/login" className="font-bold text-brand-strong hover:underline">पाठक लगइनमा जानुहोस्</a></p>
      </div>
    </section>
  </main>
}
