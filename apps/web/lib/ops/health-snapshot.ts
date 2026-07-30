/**
 * Aggregates real operational signals (Postgres pool saturation, cron
 * heartbeats, request error budget) into one honest snapshot for
 * /admin/launch. Every input is either read from the live shared pool or
 * from data the app itself recorded — no simulated metrics.
 */
import 'server-only'
import { getPoolStats } from '@/lib/pg-pool'
import { cronHealthScore, utilizationScore } from '@/lib/algorithms/product/ops-health'
import { getCronHeartbeats, minutesSince, type CronHeartbeat } from '@/lib/ops/cron-heartbeat'

export type CronJobExpectation = { job: string; label: string; intervalMinutes: number }

/** Matches the schedules declared in vercel.json's `crons`. */
export const EXPECTED_CRON_JOBS: CronJobExpectation[] = [
  { job: 'notifications-deliver', label: 'Notification delivery', intervalMinutes: 24 * 60 },
  { job: 'interactions-rebuild', label: 'CF interaction matrix rebuild', intervalMinutes: 6 * 60 },
  { job: 'digest-compose', label: 'Digest composition', intervalMinutes: 24 * 60 },
  { job: 'ops-probe', label: 'Ops anomaly probe', intervalMinutes: 30 },
  { job: 'scheduled-publish', label: 'Scheduled article publish', intervalMinutes: 10 },
  { job: 'breaking-auto-boost', label: 'Breaking auto-boost', intervalMinutes: 30 },
  { job: 'house-ad-promote', label: 'House-ad A/B winner promote', intervalMinutes: 6 * 60 },
]

export type PoolSnapshot = {
  configured: boolean
  totalCount: number
  idleCount: number
  waitingCount: number
  max: number
  saturation: number
}

export type CronSnapshot = {
  job: string
  label: string
  intervalMinutes: number
  lastRunAt: string | null
  ageMinutes: number | null
  health: number
  missed: boolean
}

export type ErrorBudgetSnapshot = {
  windowRequests: number
  errorCount: number
  errorRate: number
  budget: number
  withinBudget: boolean
}

export type OpsHealthSnapshot = {
  pool: PoolSnapshot
  cron: CronSnapshot[]
  errorBudget: ErrorBudgetSnapshot | null
  generatedAt: string
}

function poolSnapshot(): PoolSnapshot {
  const stats = getPoolStats()
  if (!stats) {
    return { configured: false, totalCount: 0, idleCount: 0, waitingCount: 0, max: 0, saturation: 0 }
  }
  const active = stats.totalCount - stats.idleCount + stats.waitingCount
  return {
    configured: true,
    totalCount: stats.totalCount,
    idleCount: stats.idleCount,
    waitingCount: stats.waitingCount,
    max: stats.max,
    saturation: utilizationScore(active, stats.max),
  }
}

function cronSnapshots(heartbeats: CronHeartbeat[]): CronSnapshot[] {
  const byJob = new Map(heartbeats.map((h) => [h.job, h]))
  return EXPECTED_CRON_JOBS.map((expectation) => {
    const heartbeat = byJob.get(expectation.job)
    const ageMinutes = minutesSince(heartbeat)
    const health = ageMinutes === null ? 0 : cronHealthScore(ageMinutes, expectation.intervalMinutes)
    return {
      job: expectation.job,
      label: expectation.label,
      intervalMinutes: expectation.intervalMinutes,
      lastRunAt: heartbeat?.lastRunAt ?? null,
      ageMinutes,
      health,
      missed: health < 1,
    }
  })
}

/**
 * Optional error-budget input: pass live counts from a request-logging
 * source if one exists. Returns null (not a fabricated "0% errors") when no
 * data is supplied, so the UI can show an honest "not tracked" state.
 */
export function errorBudgetSnapshot(input: {
  windowRequests: number
  errorCount: number
  targetErrorRate?: number
}): ErrorBudgetSnapshot {
  const budget = Math.max(0, Math.min(1, input.targetErrorRate ?? 0.01))
  const errorRate = input.windowRequests > 0 ? input.errorCount / input.windowRequests : 0
  return {
    windowRequests: input.windowRequests,
    errorCount: input.errorCount,
    errorRate,
    budget,
    withinBudget: errorRate <= budget,
  }
}

export async function getOpsHealthSnapshot(options?: {
  errorBudget?: { windowRequests: number; errorCount: number; targetErrorRate?: number }
}): Promise<OpsHealthSnapshot> {
  const heartbeats = await getCronHeartbeats().catch(() => [] as CronHeartbeat[])
  return {
    pool: poolSnapshot(),
    cron: cronSnapshots(heartbeats),
    errorBudget: options?.errorBudget ? errorBudgetSnapshot(options.errorBudget) : null,
    generatedAt: new Date().toISOString(),
  }
}
