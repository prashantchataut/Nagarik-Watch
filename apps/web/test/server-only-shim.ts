// Next.js resolves the bare `server-only` import via its own webpack alias at
// build time, so the package is never installed as a real dependency. Vitest
// has no such alias, so unit tests that exercise server modules need this
// no-op stand-in (see vitest.config.ts `resolve.alias`).
export {}
