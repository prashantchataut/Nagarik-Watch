/**
 * Single source of truth mapping every catalog id to a CapabilitySpec.
 * Legacy CORE_HANDLERS / HEURISTIC_HANDLERS are wrapped (never dropped);
 * the ~134 remaining ids come from local-all.ts. No catalog id resolves to
 * genericHeuristic/hashScore here — every registration is a dedicated
 * handler.
 */
import type { AlgorithmMode, CapabilityHandler, CapabilityResult, CapabilitySpec } from '../types'
import { ADAPTER_DISABLED_IDS, ADAPTER_READY_IDS, CORE_HANDLERS } from '../handlers/core'
import { HEURISTIC_HANDLERS } from '../handlers/heuristics'
import type { AlgorithmHandler } from '../handlers/utils'
import { surfaceFor } from './surface'
import { LOCAL_CAPABILITIES } from './local-all'

export const CAPABILITY_REGISTRY = new Map<string, CapabilitySpec>()

export function registerCapability(
  id: string,
  surface: string,
  mode: AlgorithmMode,
  run: CapabilityHandler,
): void {
  CAPABILITY_REGISTRY.set(id, { id, surface, mode, run })
}

export function getCapability(id: string): CapabilitySpec | undefined {
  return CAPABILITY_REGISTRY.get(id)
}

export function listRegisteredIds(): string[] {
  return [...CAPABILITY_REGISTRY.keys()]
}

/**
 * Resolve the honest runtime mode for an id: adapter sets always win (the
 * catalog explicitly marks these as vendor-ready/-disabled regardless of
 * what a legacy handler reports), otherwise fall back to the legacy
 * handler's declared mode (mapping 'heuristic' -> 'local'), otherwise
 * 'local'.
 */
function resolveMode(id: string, legacyMode?: string, preferredMode?: AlgorithmMode): AlgorithmMode {
  if (ADAPTER_DISABLED_IDS.has(id)) return 'adapter-disabled'
  if (ADAPTER_READY_IDS.has(id)) return 'adapter-ready'
  if (legacyMode === 'production') return 'production'
  if (legacyMode === 'local' || legacyMode === 'heuristic') return 'local'
  if (preferredMode) return preferredMode
  return 'local'
}

/** Wrap a legacy AlgorithmHandler (core.ts / heuristics.ts) into a CapabilityHandler. */
export function wrapLegacyHandler(
  id: string,
  handler: AlgorithmHandler,
  preferredMode: AlgorithmMode = 'local',
): CapabilityHandler {
  return (input: Record<string, unknown>): CapabilityResult => {
    try {
      const result = handler(input)
      return {
        ok: result.ok ?? true,
        mode: resolveMode(id, result.mode, preferredMode),
        score: result.score,
        detail: result.detail,
        outputs: result.outputs,
        surface: result.surface,
        reason: result.reason,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      return {
        ok: false,
        mode: resolveMode(id, undefined, preferredMode),
        detail: `handler threw: ${message}`,
        reason: message,
      }
    }
  }
}

for (const [id, handler] of Object.entries(CORE_HANDLERS)) {
  registerCapability(id, surfaceFor(id), resolveMode(id, 'production'), wrapLegacyHandler(id, handler, 'production'))
}

for (const [id, handler] of Object.entries(HEURISTIC_HANDLERS)) {
  if (!CAPABILITY_REGISTRY.has(id)) {
    registerCapability(id, surfaceFor(id), resolveMode(id, 'heuristic'), wrapLegacyHandler(id, handler, 'local'))
  }
}

for (const spec of LOCAL_CAPABILITIES) {
  if (!CAPABILITY_REGISTRY.has(spec.id)) {
    registerCapability(spec.id, spec.surface, resolveMode(spec.id, undefined, spec.mode), spec.run)
  }
}
