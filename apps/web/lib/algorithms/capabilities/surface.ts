import { ALGORITHM_CATALOG } from '../catalog'

const SURFACE_BY_ID: ReadonlyMap<string, string> = new Map(
  ALGORITHM_CATALOG.map((entry) => [entry.id, entry.surface]),
)

/** Look up the catalog-declared surface for an id, used when registering capabilities. */
export function surfaceFor(id: string): string {
  return SURFACE_BY_ID.get(id) ?? 'unspecified'
}
