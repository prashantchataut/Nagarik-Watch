import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGetPoolStats, mockGetCronHeartbeats } = vi.hoisted(() => ({
  mockGetPoolStats: vi.fn(),
  mockGetCronHeartbeats: vi.fn(),
}))

vi.mock('@/lib/pg-pool', () => ({
  getPoolStats: mockGetPoolStats,
}))

vi.mock('@/lib/ops/cron-heartbeat', () => ({
  getCronHeartbeats: mockGetCronHeartbeats,
  minutesSince: (heartbeat: { lastRunAt: string } | undefined, now: Date = new Date()) =>
    heartbeat ? Math.max(0, (now.getTime() - Date.parse(heartbeat.lastRunAt)) / 60_000) : null,
}))

import { errorBudgetSnapshot, getOpsHealthSnapshot } from './health-snapshot'

afterEach(() => {
  vi.clearAllMocks()
})

describe('getOpsHealthSnapshot', () => {
  it('reports an unconfigured pool honestly when no pool exists yet', async () => {
    mockGetPoolStats.mockReturnValue(null)
    mockGetCronHeartbeats.mockResolvedValue([])
    const snapshot = await getOpsHealthSnapshot()
    expect(snapshot.pool.configured).toBe(false)
    expect(snapshot.pool.saturation).toBe(0)
  })

  it('computes pool saturation from live stats', async () => {
    mockGetPoolStats.mockReturnValue({ totalCount: 1, idleCount: 0, waitingCount: 0, max: 1 })
    mockGetCronHeartbeats.mockResolvedValue([])
    const snapshot = await getOpsHealthSnapshot()
    expect(snapshot.pool.configured).toBe(true)
    expect(snapshot.pool.saturation).toBe(1)
  })

  it('marks a cron job as never when it has never run', async () => {
    mockGetPoolStats.mockReturnValue(null)
    mockGetCronHeartbeats.mockResolvedValue([])
    const snapshot = await getOpsHealthSnapshot()
    expect(snapshot.cron.length).toBeGreaterThan(0)
    expect(snapshot.cron.every((job) => job.state === 'never')).toBe(true)
    expect(snapshot.cron.every((job) => job.missed)).toBe(true)
  })

  it('marks a cron job healthy when it ran recently relative to its interval', async () => {
    mockGetPoolStats.mockReturnValue(null)
    mockGetCronHeartbeats.mockResolvedValue([
      { job: 'notifications-deliver', lastRunAt: new Date().toISOString() },
    ])
    const snapshot = await getOpsHealthSnapshot()
    const job = snapshot.cron.find((c) => c.job === 'notifications-deliver')
    expect(job?.state).toBe('ok')
    expect(job?.missed).toBe(false)
  })

  it('returns null error budget when not supplied, rather than fabricating a rate', async () => {
    mockGetPoolStats.mockReturnValue(null)
    mockGetCronHeartbeats.mockResolvedValue([])
    const snapshot = await getOpsHealthSnapshot()
    expect(snapshot.errorBudget).toBeNull()
  })
})

describe('errorBudgetSnapshot', () => {
  it('flags being over budget when error rate exceeds the target', () => {
    const result = errorBudgetSnapshot({ windowRequests: 100, errorCount: 5, targetErrorRate: 0.01 })
    expect(result.errorRate).toBeCloseTo(0.05)
    expect(result.withinBudget).toBe(false)
  })

  it('flags within budget when error rate is at or below target', () => {
    const result = errorBudgetSnapshot({ windowRequests: 1000, errorCount: 5, targetErrorRate: 0.01 })
    expect(result.withinBudget).toBe(true)
  })
})
