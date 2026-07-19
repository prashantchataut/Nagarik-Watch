/**
 * Hosted semantic-search boundary. Local BM25 + optional term-vector blend
 * remain the production path. This module documents the vendor gate honestly.
 */

export type SemanticProviderState = {
  ready: boolean
  mode: 'local-only' | 'vendor-configured'
  detail: string
}

export function getSemanticProviderState(): SemanticProviderState {
  const vendor = process.env.SEMANTIC_SEARCH_PROVIDER?.trim()
  const key = process.env.SEMANTIC_SEARCH_API_KEY?.trim()
  if (!vendor || !key) {
    return {
      ready: false,
      mode: 'local-only',
      detail:
        'No hosted semantic provider. Search uses local BM25; set SEARCH_SEMANTIC_LOCAL=1 for local term-vector blend.',
    }
  }
  return {
    ready: true,
    mode: 'vendor-configured',
    detail: `Provider ${vendor} credentials present. Hosted ANN adapter not wired; local BM25 remains active.`,
  }
}
