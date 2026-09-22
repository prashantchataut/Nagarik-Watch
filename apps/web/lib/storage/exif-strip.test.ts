import { describe, expect, it } from 'vitest'
import { stripImageMetadata } from './exif-strip'

/** JPEG: SOI, APP0/JFIF, APP1/EXIF carrying a GPS-looking payload, SOS, EOI. */
function jpegWithExif(exifPayload: Buffer): Buffer {
  const segment = (marker: number, body: Buffer) =>
    Buffer.concat([
      Buffer.from([0xff, marker]),
      (() => {
        const len = Buffer.alloc(2)
        len.writeUInt16BE(body.length + 2)
        return len
      })(),
      body,
    ])
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    segment(0xe0, Buffer.from('JFIF\0\0\0\0\0\0', 'latin1')),
    segment(0xe1, exifPayload),
    Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
    Buffer.from([0x12, 0x34, 0x56]),
    Buffer.from([0xff, 0xd9]),
  ])
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  // CRC is not validated by the stripper, which only walks length/type.
  return Buffer.concat([length, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)])
}

function pngWithText(): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', Buffer.alloc(13)),
    pngChunk('tEXt', Buffer.from('Comment\0shot at 27.7172,85.3240', 'latin1')),
    pngChunk('eXIf', Buffer.from('GPSLatitude 27.7172', 'latin1')),
    pngChunk('IDAT', Buffer.from([0x01, 0x02, 0x03, 0x04])),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function riffChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32LE(data.length)
  const pad = data.length % 2 === 1 ? Buffer.alloc(1) : Buffer.alloc(0)
  return Buffer.concat([Buffer.from(type, 'ascii'), length, data, pad])
}

function webpWithExif(): Buffer {
  const body = Buffer.concat([
    Buffer.from('WEBP', 'ascii'),
    riffChunk('VP8X', Buffer.alloc(10)),
    riffChunk('EXIF', Buffer.from('GPSLatitude 27.7172 GPSLongitude 85.3240', 'latin1')),
    riffChunk('VP8 ', Buffer.from([0x01, 0x02, 0x03, 0x04])),
  ])
  const size = Buffer.alloc(4)
  size.writeUInt32LE(body.length)
  return Buffer.concat([Buffer.from('RIFF', 'ascii'), size, body])
}

describe('stripImageMetadata', () => {
  it('removes the JPEG EXIF segment and the coordinates inside it', () => {
    const exif = Buffer.from('Exif\0\0GPSLatitude 27.7172 GPSLongitude 85.3240', 'latin1')
    const input = jpegWithExif(exif)
    expect(input.toString('latin1')).toContain('27.7172')

    const result = stripImageMetadata(input, 'image/jpeg')
    expect(result.removed).toContain('APP1/EXIF-XMP')
    expect(result.buffer.toString('latin1')).not.toContain('27.7172')
    expect(result.bytesRemoved).toBe(exif.length + 4)
  })

  it('keeps the JPEG structural markers and the entropy-coded scan intact', () => {
    const result = stripImageMetadata(
      jpegWithExif(Buffer.from('Exif\0\0secret', 'latin1')),
      'image/jpeg',
    )
    const out = result.buffer
    expect(out.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
    expect(out.subarray(out.length - 2)).toEqual(Buffer.from([0xff, 0xd9]))
    expect(out.toString('latin1')).toContain('JFIF')
    // SOS marker plus the three image bytes must survive verbatim.
    expect(out.includes(Buffer.from([0xff, 0xda]))).toBe(true)
    expect(out.includes(Buffer.from([0x12, 0x34, 0x56]))).toBe(true)
  })

  it('drops PNG text and eXIf chunks but keeps IHDR/IDAT/IEND', () => {
    const result = stripImageMetadata(pngWithText(), 'image/png')
    expect(result.removed.sort()).toEqual(['eXIf', 'tEXt'])
    const out = result.buffer.toString('latin1')
    expect(out).toContain('IHDR')
    expect(out).toContain('IDAT')
    expect(out).toContain('IEND')
    expect(out).not.toContain('27.7172')
  })

  it('drops the WebP EXIF chunk and rewrites the RIFF size header', () => {
    const result = stripImageMetadata(webpWithExif(), 'image/webp')
    expect(result.removed).toEqual(['EXIF'])
    expect(result.buffer.toString('latin1')).not.toContain('85.3240')
    // A decoder reads this field; a stale value points past end of file.
    expect(result.buffer.readUInt32LE(4)).toBe(result.buffer.length - 8)
  })

  it('returns untouched bytes for formats it cannot clean losslessly', () => {
    const gif = Buffer.from('GIF89a-pretend-image', 'latin1')
    const result = stripImageMetadata(gif, 'image/gif')
    expect(result.buffer).toEqual(gif)
    expect(result.removed).toEqual([])
    expect(result.bytesRemoved).toBe(0)
  })

  it('passes a truncated file through rather than corrupting or throwing', () => {
    const truncated = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff])
    const result = stripImageMetadata(truncated, 'image/jpeg')
    expect(result.buffer).toEqual(truncated)
    expect(result.bytesRemoved).toBe(0)
  })
})
