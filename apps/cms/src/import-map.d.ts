/**
 * Ambient declarations for the auto-generated Payload import map. Payload
 * regenerates src/app/(payload)/admin/importMap.js via `payload
 * generate:importmap`; it is .js and excluded from the tsconfig include set so
 * it never produces type noise. These shims let the route/layout templates
 * import it by relative path without "cannot find module" errors.
 */
declare module '*/importMap' {
  import type { ImportMap } from 'payload'
  export const importMap: ImportMap
}
