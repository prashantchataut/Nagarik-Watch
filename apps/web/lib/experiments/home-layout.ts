import 'server-only'
import { cookies } from 'next/headers'
import { assignVariant } from '@/lib/experiments/core'
import { getExperimentDefinition } from '@/lib/experiments/definitions'
import { bandEveryForVariant } from '@/lib/content/homepage-stream'
import {
  HOME_LAYOUT_COOKIE,
  HOME_LAYOUT_DEFAULT_VARIANTS,
  HOME_LAYOUT_EXPERIMENT_ID,
  HOME_LAYOUT_VISITOR_COOKIE,
} from '@/lib/experiments/home-layout-shared'

export {
  HOME_LAYOUT_COOKIE,
  HOME_LAYOUT_DEFAULT_VARIANTS,
  HOME_LAYOUT_EXPERIMENT_ID,
  HOME_LAYOUT_VISITOR_COOKIE,
} from '@/lib/experiments/home-layout-shared'

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
