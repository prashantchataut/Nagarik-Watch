import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const live = process.env.NEXT_PUBLIC_LAUNCH_STATUS === 'live'
const blockers = []
const warnings = []
const minPublished = Number(process.env.LAUNCH_MIN_PUBLISHED_ARTICLES ?? 40)
const minLeads = Number(process.env.LAUNCH_MIN_LEAD_READY_ARTICLES ?? 8)
const minCategories = Number(process.env.LAUNCH_MIN_CATEGORIES_WITH_CONTENT ?? 6)

function requiredEnv(name, message) {
  if (!process.env[name]?.trim()) blockers.push(message ?? `${name} is missing`)
}

if (live) {
  requiredEnv('NEXT_PUBLIC_PUBLICATION_LEGAL_NAME', 'Legal publisher name is missing')
  requiredEnv('NEXT_PUBLIC_EDITOR_IN_CHIEF', 'Editor-in-chief is missing')
  requiredEnv('NEXT_PUBLIC_DOIB_NUMBER', 'Publication registration number is missing')
  requiredEnv('NEXT_PUBLIC_NEWSROOM_PHONE', 'Newsroom phone is missing')
  requiredEnv('NEXT_PUBLIC_NEWSROOM_ADDRESS', 'Newsroom address is missing')
  requiredEnv('DATABASE_URL', 'DATABASE_URL is required for durable production state')
  if (!(process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET)) blockers.push('AUTH_SECRET or BETTER_AUTH_SECRET is missing')
  if (process.env.PAYLOAD_CONTENT_SOURCE !== 'payload') warnings.push('PAYLOAD_CONTENT_SOURCE is not payload; checking JSON store thresholds instead')
  if (process.env.NEXT_PUBLIC_ADS_MODE !== 'off' && !process.env.NEXT_PUBLIC_AD_SALES_EMAIL) blockers.push('Advertising sales email is missing')
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) blockers.push('Analytics domain is missing')
}

if (live && process.env.PAYLOAD_CONTENT_SOURCE !== 'payload') {
  const candidates = [join(process.cwd(), 'apps/web/data/articles.json'), join(process.cwd(), 'data/articles.json')]
  const file = candidates.find(existsSync)
  const data = file ? JSON.parse(readFileSync(file, 'utf8')) : { articles: [] }
  const articles = Array.isArray(data.articles) ? data.articles : []
  const published = articles.filter((a) => a.workflowStage === 'published' && !a.noIndex)
  const leads = published.filter((a) => a.isFeatured === 'lead' || a.isFeatured === 'secondary')
  const categories = new Set(published.map((a) => a.categorySlug).filter(Boolean))
  if (published.length < minPublished) blockers.push(`Only ${published.length}/${minPublished} published launch stories found`)
  if (leads.length < minLeads) blockers.push(`Only ${leads.length}/${minLeads} lead-ready stories found`)
  if (categories.size < minCategories) blockers.push(`Only ${categories.size}/${minCategories} categories have published content`)
}

if (warnings.length) {
  console.warn('Launch gate warnings:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}
if (blockers.length) {
  console.error('Launch gate failed:')
  for (const blocker of blockers) console.error(`- ${blocker}`)
  process.exit(1)
}
console.log(live ? 'Launch gate passed.' : 'Launch gate skipped strict checks because NEXT_PUBLIC_LAUNCH_STATUS is not live.')
