/**
 * Brand mark rendered above the admin nav (referenced from payload.config.ts).
 * Devanagari-primary lockup in Civic Crimson so editors always know which product they're in.
 */
export const BrandMark = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        padding: '0.75rem 1rem 0.5rem',
        fontWeight: 700,
      }}
    >
      <span style={{ color: 'var(--nw-brand)', fontSize: '1.1rem' }}>नागरिक वाच</span>
      <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 500 }}>Nagarik Watch</span>
    </div>
  )
}

export default BrandMark
