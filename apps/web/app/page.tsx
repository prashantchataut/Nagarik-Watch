import '@nagarikwatch/ui/tokens.css'

/**
 * Phase 0 stub homepage. The real homepage (Hero + category SectionBlocks + breaking
 * ticker) is built in Phase 1, Task 1.5. This exists to prove the workspace, tokens, and
 * Devanagari rendering all work end to end.
 */
export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 'var(--body-max)',
        margin: '0 auto',
        padding: 'var(--space-12) var(--space-6)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ color: 'var(--brand)', fontFamily: 'var(--font-devanagari, system-ui)' }}>
        नागरिक वाच
      </h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Nagarik Watch — Phase 0 foundation. Reader experience ships in Phase 1.
      </p>
    </main>
  )
}
