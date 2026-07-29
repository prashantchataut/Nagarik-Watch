/**
 * Client-safe home-layout experiment constants.
 * Keep server-only cookie resolution in `home-layout.ts`.
 */
import type { ExperimentVariant } from '@/lib/experiments/core'

export const HOME_LAYOUT_EXPERIMENT_ID = 'home-layout-v1'
export const HOME_LAYOUT_COOKIE = 'nw_home_layout_v1'
export const HOME_LAYOUT_VISITOR_COOKIE = 'nw_experiment_visitor'

export const HOME_LAYOUT_DEFAULT_VARIANTS: ExperimentVariant[] = [
  { id: 'band-every-2', label: 'Featured every 2 sections', weight: 1 },
  { id: 'band-every-3', label: 'Featured every 3 sections', weight: 1 },
]
