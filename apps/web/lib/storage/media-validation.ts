import 'server-only'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024

export function allowedImageMime(type: string): boolean {
  return ALLOWED.has(type)
}

/** Sniff image type from magic bytes — do not trust client Content-Type alone. */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif'
  }
  // AVIF is an ISO BMFF file. The major brand is commonly `avif`/`avis`,
  // while some encoders use a generic major brand and list AVIF as a
  // compatible brand shortly after `ftyp`.
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brandWindow = buffer.subarray(8, Math.min(buffer.length, 40)).toString('ascii')
    if (brandWindow.includes('avif') || brandWindow.includes('avis')) return 'image/avif'
  }
  return null
}

export function validateImageUpload(input: {
  buffer: Buffer
  declaredType: string
  size: number
}): { ok: true; contentType: string } | { ok: false; error: string } {
  if (input.size === 0) return { ok: false, error: 'Empty file.' }
  if (input.size > MAX_MEDIA_BYTES) return { ok: false, error: 'Image must be 8MB or smaller.' }
  const sniffed = sniffImageMime(input.buffer)
  if (!sniffed) return { ok: false, error: 'Unsupported or corrupted image file.' }
  if (!allowedImageMime(sniffed)) return { ok: false, error: 'Use JPEG, PNG, WebP, GIF, or AVIF.' }
  if (input.declaredType && input.declaredType !== sniffed) {
    return { ok: false, error: 'File type does not match contents.' }
  }
  return { ok: true, contentType: sniffed }
}
