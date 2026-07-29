import { cookies } from 'next/headers'
import { assignVariant, type ExperimentVariant } from '@/lib/experiments/core'
import { getExperimentDefinition } from '@/lib/experiments/definitions'
import { bandEveryForVariant } from '@/lib/content/homepage-stream'

export const HOME_LAYOUT_EXPERIMENT_ID = 'home-layout-v1'
export const HOME_LAYOUT_COOKIE = 'nw_home_layout_v1'
export const HOME_LAYOUT_VISITOR_COOKIE = 'nw_experiment_visitor'

export const HOME_LAYOUT_DEFAULT_VARIANTS: ExperimentVariant[] = [
  { id: 'band-every-2', label: 'Featured every 2 sections', weight: 1 },
  { id: 'band-every-3', label: 'Featured every 3 sections', weight: 1 },
]

/**
 * Stable SSR assignment for homepage featured-band spacing.
 * Prefers an existing cookie; otherwise assigns from visitor cookie when present.
 * First anonymous paint stays on control (every 2) to avoid layout flash.
 */
export async function resolveHomeLayoutBandEvery(): Promise<{
  bandEvery: number
  variantId: string | null
}> {
  const jar = await cookies()
  const existing = jar.get(HOME_LAYOUT_COOKIE)?.value?.trim() || null
  if (existing) {
    return { bandEvery: bandEveryForVariant(existing), variantId: existing }
  }

  const visitor = jar.get(HOME_LAYOUT_VISITOR_COOKIE)?.value?.trim() || null
  if (!visitor) {
    return { bandEvery: 2, variantId: null }
  }

  const definition = getExperimentDefinition(HOME_LAYOUT_EXPERIMENT_ID)
  const variants =
    definition?.status === 'active' && definition.variants.length >= 2
      ? definition.variants
      : HOME_LAYOUT_DEFAULT_VARIANTS

  const assigned = assignVariant(HOME_LAYOUT_EXPERIMENT_ID, visitor, variants)
  const variantId = assigned?.id ?? null
  return { bandEvery: bandEveryForVariant(variantId), variantId }
}
