/**
 * Remove metadata segments from an uploaded image before it is stored.
 *
 * A phone photo from a protest, a flood, or a source's home carries the GPS
 * fix, the device serial and the capture timestamp in EXIF. Publishing that
 * verbatim leaks where a photographer stood and, often, who they met. The
 * uploader cannot be relied on to strip it, so the server does — this runs on
 * every newsroom upload before the bytes reach R2, Blob, or disk.
 *
 * Deliberately byte-level and dependency-free: it walks container structure
 * and drops known metadata segments. It never re-encodes, so image quality is
 * untouched and a format it does not understand is returned unchanged rather
 * than corrupted.
 */

export type ExifStripResult = {
  buffer: Buffer
  /** Segment/chunk names removed, for the audit line. */
  removed: string[]
  bytesRemoved: number
}

/** JPEG APPn markers that carry metadata. APP0 (JFIF) is structural — keep it. */
const JPEG_METADATA_MARKERS = new Map<number, string>([
  [0xe1, 'APP1/EXIF-XMP'],
  [0xe2, 'APP2/ICC-FlashPix'],
  [0xe3, 'APP3'],
  [0xe4, 'APP4'],
  [0xe5, 'APP5'],
  [0xe6, 'APP6'],
  [0xe7, 'APP7'],
  [0xe8, 'APP8'],
  [0xe9, 'APP9'],
  [0xea, 'APP10'],
  [0xeb, 'APP11'],
  [0xec, 'APP12'],
  [0xed, 'APP13/IPTC'],
  [0xee, 'APP14/Adobe'],
  [0xef, 'APP15'],
  [0xfe, 'COM'],
])

function stripJpeg(buffer: Buffer): ExifStripResult {
  const kept: Buffer[] = []
  const removed: string[] = []
  let offset = 2 // SOI
  kept.push(buffer.subarray(0, 2))

  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) break
    const marker = buffer[offset + 1]!
    // Start of scan: the rest is entropy-coded image data, copy verbatim.
    if (marker === 0xda) {
      kept.push(buffer.subarray(offset))
      offset = buffer.length
      break
    }
    if (marker === 0xd9) {
      kept.push(buffer.subarray(offset))
      offset = buffer.length
      break
    }
    const length = buffer.readUInt16BE(offset + 2)
    if (length < 2 || offset + 2 + length > buffer.length) {
      // Malformed length — stop rewriting and keep the remainder intact.
      kept.push(buffer.subarray(offset))
      offset = buffer.length
      break
    }
    const name = JPEG_METADATA_MARKERS.get(marker)
    if (name) removed.push(name)
    else kept.push(buffer.subarray(offset, offset + 2 + length))
    offset += 2 + length
  }
  if (offset < buffer.length) kept.push(buffer.subarray(offset))

  const out = Buffer.concat(kept)
  return { buffer: out, removed, bytesRemoved: buffer.length - out.length }
}

/** PNG ancillary chunks that carry text, timestamps, or embedded EXIF. */
const PNG_METADATA_CHUNKS = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt', 'tIME'])

function stripPng(buffer: Buffer): ExifStripResult {
  const kept: Buffer[] = [buffer.subarray(0, 8)]
  const removed: string[] = []
  let offset = 8

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii')
    const total = 12 + length // length + type + data + crc
    if (length > buffer.length || offset + total > buffer.length) {
      kept.push(buffer.subarray(offset))
      offset = buffer.length
      break
    }
    if (PNG_METADATA_CHUNKS.has(type)) removed.push(type)
    else kept.push(buffer.subarray(offset, offset + total))
    offset += total
    if (type === 'IEND') break
  }
  if (offset < buffer.length) kept.push(buffer.subarray(offset))

  const out = Buffer.concat(kept)
  return { buffer: out, removed, bytesRemoved: buffer.length - out.length }
}

/** WebP RIFF chunks that carry metadata. VP8/VP8L/VP8X/ALPH are structural. */
const WEBP_METADATA_CHUNKS = new Set(['EXIF', 'XMP '])

function stripWebp(buffer: Buffer): ExifStripResult {
  const kept: Buffer[] = [buffer.subarray(0, 12)]
  const removed: string[] = []
  let offset = 12

  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii')
    const length = buffer.readUInt32LE(offset + 4)
    // RIFF chunks are padded to an even length.
    const total = 8 + length + (length % 2)
    if (offset + total > buffer.length) {
      kept.push(buffer.subarray(offset))
      offset = buffer.length
      break
    }
    if (WEBP_METADATA_CHUNKS.has(type)) removed.push(type.trim())
    else kept.push(buffer.subarray(offset, offset + total))
    offset += total
  }
  if (offset < buffer.length) kept.push(buffer.subarray(offset))

  const out = Buffer.concat(kept)
  if (removed.length === 0) return { buffer, removed, bytesRemoved: 0 }
  // The RIFF header carries the total payload size; rewrite it or decoders
  // will read past the end of the file we just shortened.
  out.writeUInt32LE(out.length - 8, 4)
  return { buffer: out, removed, bytesRemoved: buffer.length - out.length }
}

/**
 * Strip metadata for the formats we can do so safely and losslessly.
 *
 * GIF and AVIF are returned untouched: GIF has no EXIF convention worth the
 * rewrite risk, and AVIF metadata lives in ISO BMFF boxes that cannot be
 * dropped without recomputing offsets. Callers can see that from `removed`
 * being empty — nothing here pretends to have cleaned a file it did not.
 */
export function stripImageMetadata(buffer: Buffer, contentType: string): ExifStripResult {
  try {
    if (contentType === 'image/jpeg') return stripJpeg(buffer)
    if (contentType === 'image/png') return stripPng(buffer)
    if (contentType === 'image/webp') return stripWebp(buffer)
  } catch {
    // A malformed file is the uploader's problem, not a reason to 500. The
    // validator already sniffed the magic bytes; pass the original through.
    return { buffer, removed: [], bytesRemoved: 0 }
  }
  return { buffer, removed: [], bytesRemoved: 0 }
}

/** Formats this module can actually clean, for honest surface reporting. */
export const EXIF_STRIPPABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
