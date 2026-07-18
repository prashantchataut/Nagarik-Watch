/**
 * Public `/` is rewritten to `/ne` by middleware (see middleware.ts).
 * This file is a typed safety net only — never host admin chrome here.
 */
export default function RootPage() {
  return null
}
