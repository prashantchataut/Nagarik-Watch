import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getLaunchChecksAsync, launchScore } from '@/lib/launch-readiness'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लन्च चेक',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LaunchPage() {
  await requireNewsroomSession()
  const checks = await getLaunchChecksAsync()
  const score = launchScore(checks)
  return (
    <div>
      <AdminPageHeader title="लन्च चेक" subtitle="Production gate before showing the client a serious build" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <AdminCard className="border-l-4 border-l-brand"><p className="text-caption uppercase tracking-wide text-mute">Readiness</p><p className="font-display text-[4rem] font-black leading-none text-ink">{score}%</p><p className="mt-2 text-meta text-ink-soft">100% requires passing env, auth, persistent DB, storage, email and live data checks.</p></AdminCard>
        <AdminCard><p className="font-display text-h2 text-ink" lang="ne">प्रकाशन अघिको नियम</p><p className="mt-2 text-meta leading-7 text-ink-soft" lang="ne">Fail भएका items सार्वजनिक लन्च अघि सच्याउनुपर्छ। Warn भएका items स्पष्ट UI लेबल वा manual fallback सहित मात्र देखाउनुहोस्। नक्कली लाइभ डाटा, नक्कली विज्ञापन र नक्कली पेवाल सार्वजनिक रूपमा नदेखाउनुहोस्।</p></AdminCard>
      </div>
      <div className="grid gap-3">
        {checks.map((check) => (
          <AdminCard key={check.key} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
            <span className={check.status === 'pass' ? 'rounded-full bg-brand-tint px-2.5 py-1 text-caption font-bold text-brand-strong' : check.status === 'warn' ? 'rounded-full border border-rule px-2.5 py-1 text-caption font-bold text-ink-soft' : 'rounded-full bg-red-50 px-2.5 py-1 text-caption font-bold text-red-700'}>{check.status.toUpperCase()}</span>
            <div><p className="font-display text-h3 text-ink">{check.label}</p><p className="text-meta text-ink-soft">{check.detail}</p></div>
            <code className="text-caption text-mute">{check.key}</code>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
