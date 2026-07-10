'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ne">
      <body>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '6rem 1rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1>सेवा अस्थायी रूपमा उपलब्ध छैन</h1>
          <p>Please retry. If the problem continues, contact the newsroom administrator.</p>
          <button type="button" onClick={reset} style={{ marginTop: 24, padding: '12px 20px', borderRadius: 999 }}>
            Retry
          </button>
        </main>
      </body>
    </html>
  )
}
