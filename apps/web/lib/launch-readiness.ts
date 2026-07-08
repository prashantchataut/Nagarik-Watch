import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

export type LaunchIssue = {
  key: string
  severity: 'blocker' | 'warning'
  labelNe: string
  labelEn: string
}

type StoredArticleForGate = {
  workflowStage?: string
  isFeatured?: string
  categorySlug?: string
  publishedAt?: string
  hasEnglish?: boolean
  noIndex?: boolean
}

const MIN_PUBLISHED = Number(process.env.LAUNCH_MIN_PUBLISHED_ARTICLES ?? 40)
const MIN_LEADS = Number(process.env.LAUNCH_MIN_LEAD_READY_ARTICLES ?? 8)
const MIN_CATEGORIES = Number(process.env.LAUNCH_MIN_CATEGORIES_WITH_CONTENT ?? 6)
const MIN_RECENT_DAYS = Number(process.env.LAUNCH_MIN_RECENT_DAYS ?? 7)

export function getLaunchIssues(): LaunchIssue[] {
  const issues: LaunchIssue[] = []
  const live = process.env.NEXT_PUBLIC_LAUNCH_STATUS === 'live'
  const contentSource = process.env.PAYLOAD_CONTENT_SOURCE
  const adsMode = process.env.NEXT_PUBLIC_ADS_MODE
  const stored = readStoredArticles()
  const published = stored.filter((a) => a.workflowStage === 'published' && !a.noIndex)
  const leadReady = published.filter((a) => a.isFeatured === 'lead' || a.isFeatured === 'secondary')
  const categoriesWithContent = new Set(published.map((a) => a.categorySlug).filter(Boolean)).size
  const recentCutoff = Date.now() - MIN_RECENT_DAYS * 24 * 60 * 60 * 1000
  const recent = published.filter((a) => a.publishedAt && Date.parse(a.publishedAt) >= recentCutoff)

  if (!process.env.NEXT_PUBLIC_PUBLICATION_LEGAL_NAME?.trim()) {
    issues.push({
      key: 'legal-name',
      severity: 'blocker',
      labelNe: 'कानुनी प्रकाशक नाम राखिएको छैन',
      labelEn: 'Legal publisher name is missing',
    })
  }
  if (!process.env.NEXT_PUBLIC_EDITOR_IN_CHIEF?.trim()) {
    issues.push({
      key: 'editor',
      severity: 'blocker',
      labelNe: 'प्रधान सम्पादक/जिम्मेवार व्यक्ति राखिएको छैन',
      labelEn: 'Editor-in-chief or responsible editor is missing',
    })
  }
  if (!process.env.NEXT_PUBLIC_DOIB_NUMBER?.trim()) {
    issues.push({
      key: 'registration',
      severity: 'blocker',
      labelNe: 'प्रकाशन दर्ता नम्बर राखिएको छैन',
      labelEn: 'Publication registration number is missing',
    })
  }
  if (!process.env.NEXT_PUBLIC_NEWSROOM_PHONE?.trim()) {
    issues.push({
      key: 'phone',
      severity: live ? 'blocker' : 'warning',
      labelNe: 'न्यूजरुम फोन नम्बर राखिएको छैन',
      labelEn: 'Newsroom phone number is missing',
    })
  }
  if (!process.env.NEXT_PUBLIC_NEWSROOM_ADDRESS?.trim()) {
    issues.push({
      key: 'address',
      severity: live ? 'blocker' : 'warning',
      labelNe: 'न्यूजरुम ठेगाना राखिएको छैन',
      labelEn: 'Newsroom address is missing',
    })
  }
  if (contentSource !== 'payload' && live) {
    issues.push({
      key: 'cms',
      severity: 'blocker',
      labelNe: 'लाइभ मोडमा Payload CMS स्रोत जोडिएको छैन',
      labelEn: 'Payload CMS source is not wired for live mode',
    })
  }
  if (!process.env.DATABASE_URL?.startsWith('postgres') && live) {
    issues.push({
      key: 'database',
      severity: 'blocker',
      labelNe: 'टिप्पणी, बुकमार्क, मतदान र न्युजलेटरका लागि Postgres जोडिएको छैन',
      labelEn:
        'Postgres is not configured for comments, bookmarks, polls, reading history and newsletter state',
    })
  }
  if (!process.env.AUTH_SECRET && !process.env.BETTER_AUTH_SECRET && live) {
    issues.push({
      key: 'auth-secret',
      severity: 'blocker',
      labelNe: 'सुरक्षित AUTH_SECRET राखिएको छैन',
      labelEn: 'Secure AUTH_SECRET is missing',
    })
  }
  if (adsMode === 'network' && !process.env.NEXT_PUBLIC_AD_NETWORK?.trim()) {
    issues.push({
      key: 'ad-network',
      severity: 'blocker',
      labelNe: 'Network ad mode छ तर विज्ञापन प्रदायक राखिएको छैन',
      labelEn: 'Network ad mode is enabled without an ad provider',
    })
  }
  if (adsMode !== 'off' && !process.env.NEXT_PUBLIC_AD_SALES_EMAIL?.trim() && live) {
    issues.push({
      key: 'ad-sales',
      severity: 'blocker',
      labelNe: 'विज्ञापन बिक्री सम्पर्क राखिएको छैन',
      labelEn: 'Advertising sales contact is missing',
    })
  }
  if (!process.env.NEWSLETTER_API_KEY && live) {
    issues.push({
      key: 'newsletter-provider',
      severity: 'warning',
      labelNe: 'न्युजलेटर पठाउने प्रदायक राखिएको छैन',
      labelEn: 'Newsletter sending provider is missing',
    })
  }
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim()) {
    issues.push({
      key: 'analytics',
      severity: live ? 'blocker' : 'warning',
      labelNe: 'Analytics domain राखिएको छैन',
      labelEn: 'Analytics domain is missing',
    })
  }

  if (live && contentSource !== 'payload') {
    if (published.length < MIN_PUBLISHED) {
      issues.push({
        key: 'content-count',
        severity: 'blocker',
        labelNe: `प्रकाशित समाचार ${MIN_PUBLISHED} भन्दा कम छन्`,
        labelEn: `Fewer than ${MIN_PUBLISHED} published stories are available`,
      })
    }
    if (leadReady.length < MIN_LEADS) {
      issues.push({
        key: 'lead-count',
        severity: 'blocker',
        labelNe: `मुख्य/दोस्रो प्राथमिकताका समाचार ${MIN_LEADS} भन्दा कम छन्`,
        labelEn: `Fewer than ${MIN_LEADS} lead-ready stories are available`,
      })
    }
    if (categoriesWithContent < MIN_CATEGORIES) {
      issues.push({
        key: 'category-density',
        severity: 'blocker',
        labelNe: `सामग्री भएका विभाग ${MIN_CATEGORIES} भन्दा कम छन्`,
        labelEn: `Fewer than ${MIN_CATEGORIES} categories have published stories`,
      })
    }
    if (recent.length < MIN_RECENT_DAYS) {
      issues.push({
        key: 'recency',
        severity: 'blocker',
        labelNe: `${MIN_RECENT_DAYS} दिनको ताजा सामग्री पर्याप्त छैन`,
        labelEn: `Not enough recent stories in the last ${MIN_RECENT_DAYS} days`,
      })
    }
  }

  return issues
}

export function isPublicLaunchReady(): boolean {
  return getLaunchIssues().every((issue) => issue.severity !== 'blocker')
}

function readStoredArticles(): StoredArticleForGate[] {
  const candidates = [
    path.join(process.cwd(), 'data', 'articles.json'),
    path.join(process.cwd(), 'apps', 'web', 'data', 'articles.json'),
  ]
  for (const file of candidates) {
    try {
      const raw = fs.readFileSync(file, 'utf-8')
      const parsed = JSON.parse(raw) as { articles?: StoredArticleForGate[] }
      return Array.isArray(parsed.articles) ? parsed.articles : []
    } catch {
      // Try the next candidate. Missing file means Payload may be canonical.
    }
  }
  return []
}
