/**
 * Aggregates dedicated CapabilitySpecs for every catalog id that is NOT
 * already covered by CORE_HANDLERS or HEURISTIC_HANDLERS (~134 ids). Split
 * by domain for readability; imported once by registry.ts so the whole
 * catalog resolves to a real handler with no hashScore/genericHeuristic
 * fallback.
 */
import { LOCAL_RECSYS_CAPABILITIES } from './local-recsys'
import { LOCAL_NLP_CAPABILITIES } from './local-nlp'
import { LOCAL_NOTIFICATIONS_CAPABILITIES } from './local-notifications'
import { LOCAL_GROWTH_CAPABILITIES } from './local-growth'
import { LOCAL_REVENUE_CAPABILITIES } from './local-revenue'
import { LOCAL_TRUST_CAPABILITIES } from './local-trust'
import { LOCAL_RETENTION_CAPABILITIES } from './local-retention'
import { LOCAL_INFRASTRUCTURE_CAPABILITIES } from './local-infrastructure'
import { LOCAL_PERFORMANCE_CAPABILITIES } from './local-performance'
import { LOCAL_ADVERTISING_CAPABILITIES } from './local-advertising'
import { LOCAL_EXPERIMENTATION_CAPABILITIES } from './local-experimentation'
import { LOCAL_DISTRIBUTION_CAPABILITIES } from './local-distribution'
import { LOCAL_SECURITY_CAPABILITIES } from './local-security'
import { LOCAL_SYNDICATION_CAPABILITIES } from './local-syndication'
import { LOCAL_EPAPER_CAPABILITIES } from './local-epaper'
import type { CapabilitySpec } from '../types'

export const LOCAL_CAPABILITIES: CapabilitySpec[] = [
  ...LOCAL_RECSYS_CAPABILITIES,
  ...LOCAL_NLP_CAPABILITIES,
  ...LOCAL_NOTIFICATIONS_CAPABILITIES,
  ...LOCAL_GROWTH_CAPABILITIES,
  ...LOCAL_REVENUE_CAPABILITIES,
  ...LOCAL_TRUST_CAPABILITIES,
  ...LOCAL_RETENTION_CAPABILITIES,
  ...LOCAL_INFRASTRUCTURE_CAPABILITIES,
  ...LOCAL_PERFORMANCE_CAPABILITIES,
  ...LOCAL_ADVERTISING_CAPABILITIES,
  ...LOCAL_EXPERIMENTATION_CAPABILITIES,
  ...LOCAL_DISTRIBUTION_CAPABILITIES,
  ...LOCAL_SECURITY_CAPABILITIES,
  ...LOCAL_SYNDICATION_CAPABILITIES,
  ...LOCAL_EPAPER_CAPABILITIES,
]
