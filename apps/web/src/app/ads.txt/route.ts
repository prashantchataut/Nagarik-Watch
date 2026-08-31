/** IAB ads.txt — declares authorized digital sellers. Replace/extend the
 *  placeholder entries with the real ad-network IDs when signing deals. */
export function GET() {
  const lines = [
    '# ads.txt — नागरिक वाच (nagarikwatch.com)',
    '# विज्ञापन सञ्जालसँग सम्झौता भएपछि यहाँ वास्तविक पहिचानहरू थपिन्छन्।',
  ]
  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
