/**
 * Shared operations-health math: anomaly z-scores, pool/connection
 * utilization, autoscale headroom, rollout risk, and cron health. Used by
 * infrastructure and performance local capabilities.
 */
import { mean, stddev } from '../handlers/utils'

export function zScoreAnomaly(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const s = stddev(values) || 1
  const latest = values[values.length - 1] ?? m
  return Math.abs((latest - m) / s)
}

export function utilizationScore(active: number, capacity: number): number {
  if (capacity <= 0) return 1
  return Math.max(0, Math.min(1, active / capacity))
}

export function autoscaleHeadroom(current: number, max: number, forecast: number): number {
  const projected = Math.max(current, forecast)
  return Math.max(0, Math.min(1, 1 - projected / Math.max(1, max)))
}

export function rolloutRiskScore(errorRateDelta: number, trafficPercent: number): number {
  return Math.max(0, Math.min(1, Math.abs(errorRateDelta) * 5 * (trafficPercent / 100)))
}

export function cronHealthScore(ageMinutes: number, intervalMinutes: number): number {
  if (intervalMinutes <= 0) return 0
  const ratio = ageMinutes / intervalMinutes
  return ratio <= 1.5 ? 1 : Math.max(0, Math.min(1, 1.5 / ratio))
}
