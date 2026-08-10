/**
 * E-paper (digital replica) data access. Wraps the pure math in
 * `lib/algorithms/product/epaper.ts` with the actual entitlement, config,
 * and offline-caching decisions the public route and admin tooling need.
 *
 * There is no print/circulation data source in this app yet, so
 * `reconcileCirculation` and `listReplicaPages` are honest about absence —
 * they never invent fixture pages or partner circulation numbers.
 */
import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ReaderSession } from '@/lib/auth/session'
import { isPremiumSubscriber, isPublicMembershipEnabled } from '@/lib/membership'
import {
  circulationVariance,
  entitlementOk,
  offlineCacheHealth,
  pageFlipBudgetMs,
  pageFlipScore,
  replicaRenderScore,
} from '@/lib/algorithms/product/epaper'

export type ReplicaPage = {
  pageNumber: number
  imageUrl: string
  premium?: boolean
}

export type ReplicaEdition = {
  date: string
  edition: string
  pages: ReplicaPage[]
}

export function epaperEnabled(): boolean {
  return (process.env.EPAPER_ENABLED ?? '').trim().toLowerCase() === 'true'
}

function isValidPage(value: unknown): value is ReplicaPage {
  if (!value || typeof value !== 'object') return false
  const page = value as Record<string, unknown>
  return (
    typeof page.pageNumber === 'number' &&
    typeof page.imageUrl === 'string' &&
    page.imageUrl.length > 0
  )
}

function isValidEdition(value: unknown): value is ReplicaEdition {
  if (!value || typeof value !== 'object') return false
  const edition = value as Record<string, unknown>
  return (
    typeof edition.date === 'string' &&
    typeof edition.edition === 'string' &&
    Array.isArray(edition.pages) &&
    edition.pages.every(isValidPage)
  )
}

async function loadConfiguredEditions(): Promise<ReplicaEdition[]> {
  const configPath = process.env.EPAPER_CONFIG_PATH?.trim()
  if (!configPath) return []
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), configPath), 'utf-8')
    const parsed = JSON.parse(raw) as { editions?: unknown }
    if (!Array.isArray(parsed.editions)) return []
    return parsed.editions.filter(isValidEdition)
  } catch {
    return []
  }
}

export type ReplicaIndex = { enabled: boolean; editions: ReplicaEdition[] }

/** Honest empty state (`editions: []`) when e-paper is disabled or no config file resolves. */
export async function listReplicaPages(): Promise<ReplicaIndex> {
  if (!epaperEnabled()) return { enabled: false, editions: [] }
  return { enabled: true, editions: await loadConfiguredEditions() }
}

export type EntitlementCheck = { allowed: boolean; tier: 'free' | 'digital'; reason: string }

/** Free pages are always allowed; premium pages require membership only when public membership is on. */
export async function checkEntitlement(
  session: ReaderSession | null,
  page: Pick<ReplicaPage, 'premium'>,
): Promise<EntitlementCheck> {
  if (!page.premium || !isPublicMembershipEnabled()) {
    return { allowed: true, tier: 'free', reason: 'Page is not gated.' }
  }
  const premium = await isPremiumSubscriber(session)
  const tier: 'free' | 'digital' = premium ? 'digital' : 'free'
  const allowed = entitlementOk(tier, 'digital')
  return {
    allowed,
    tier,
    reason: allowed
      ? 'Digital membership verified.'
      : 'A digital membership is required to read this replica page.',
  }
}

export type OfflineCachePolicyInput = {
  totalPages: number
  cachedPages: number
  quotaMb: number
  usedMb: number
  saveData: boolean
}

export type OfflineCachePolicyResult = {
  shouldCacheMore: boolean
  maxCachedPages: number
  healthScore: number
}

/** Save-Data / reduced-data requests cap how many replica pages we proactively cache offline. */
export function offlineCachePolicy(input: OfflineCachePolicyInput): OfflineCachePolicyResult {
  const healthScore = offlineCacheHealth(
    input.cachedPages,
    input.totalPages,
    input.quotaMb,
    input.usedMb,
  )
  const maxCachedPages = input.saveData ? Math.min(input.totalPages, 5) : input.totalPages
  return {
    shouldCacheMore: !input.saveData && input.cachedPages < maxCachedPages && healthScore < 1,
    maxCachedPages,
    healthScore,
  }
}

export type CirculationReconciliation = {
  printCopies: number
  digitalEntitlements: number
  variance: number
  withinTolerance: boolean
}

/** Pass real print/digital counts from a future circulation source; there is no fixture default. */
export function reconcileCirculation(
  printCopies: number,
  digitalEntitlements: number,
  toleranceRatio = 0.2,
): CirculationReconciliation {
  return {
    printCopies,
    digitalEntitlements,
    variance: circulationVariance(printCopies, digitalEntitlements),
    withinTolerance: circulationVariance(printCopies, digitalEntitlements) <= toleranceRatio,
  }
}

export type PageFlipBudget = { deviceTier: 'low' | 'mid' | 'high'; budgetMs: number }

export function pageFlipBudget(deviceTier: 'low' | 'mid' | 'high'): PageFlipBudget {
  return { deviceTier, budgetMs: pageFlipBudgetMs(deviceTier) }
}

export function scorePageFlip(deviceTier: 'low' | 'mid' | 'high', measuredFlipMs: number): number {
  return pageFlipScore(deviceTier, measuredFlipMs)
}

export { replicaRenderScore }
