import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Newsroom Login',
  description: 'Staff-only sign in to the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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

  const workflow = [
    'Draft, review, schedule and publish articles',
    'Manage media credits, alt text and source attribution',
    'Moderate comments, tips, polls and newsletter queues',
    'Check SEO, live widgets, roles and audit history',
  ]

  return (
    <main className="min-h-screen bg-surface lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <section className="hidden border-r border-rule bg-surface-raised px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <a href="/" className="inline-flex w-fit rounded-md" aria-label="Nagarik Watch home">
          <Logo siteName="नागरिक वाच" />
        </a>

        <div className="max-w-lg">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
            Staff-only newsroom
          </p>
          <h1
            className="mt-4 font-display text-[3.2rem] font-extrabold leading-[1.04] text-ink"
            lang="ne"
          >
            समाचार प्रकाशन गर्ने ठाउँ, पाठक लगइन होइन।
          </h1>
          <p className="mt-5 text-body-lg leading-relaxed text-ink-soft" lang="ne">
            यो पृष्ठ सम्पादक, लेखक र प्रशासनिक कर्मचारीका लागि हो। पाठकले समाचार पढ्न वा संग्रह गर्न
            अलग पाठक खाता प्रयोग गर्छन्।
          </p>
          <ul className="mt-7 grid gap-2 text-body text-ink-soft" lang="en">
            {workflow.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-caption text-mute" lang="ne">
          गलत ठाउँमा हुनुहुन्छ?{' '}
          <a href="/auth/login" className="font-semibold text-ink-soft hover:text-brand-strong">
            पाठक लगइन
          </a>{' '}
          प्रयोग गर्नुहोस्।
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="mx-auto mb-8 flex w-fit rounded-md lg:hidden"
            aria-label="Nagarik Watch home"
          >
            <Logo siteName="नागरिक वाच" />
          </a>
          <div>
            <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
              Newsroom access
            </p>
            <h2
              className="mt-2 font-display text-h1 font-extrabold leading-tight text-ink"
              lang="ne"
            >
              स्टाफ लगइन
            </h2>
            <p className="mt-2 text-body text-ink-soft" lang="ne">
              केवल स्वीकृत न्युजरुम खाताबाट प्रवेश हुन्छ। सफल लगइनपछि ड्यासबोर्डमा जानु सामान्य
              व्यवहार हो।
            </p>
          </div>

          <div className="mt-7 rounded-lg border border-rule bg-surface-raised p-5 shadow-card sm:p-6">
            <AdminLoginForm />
          </div>
        </div>
      </section>
    </main>
  )
}
