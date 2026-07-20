import 'server-only'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.LOCAL_MEDIA_DIR?.trim() || '.data/uploads',
)

const NEWSROOM_DIR = 'newsroom'

export type LocalMediaSaveResult = {
  url: string
  pathname: string
  bytes: number
  contentType: string
}

export function localMediaPublicBaseUrl(requestOrigin?: string): string {
  const configured = process.env.STORAGE_PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  // Same-origin relative URLs work with next/image and any dev port.
  if (process.env.NODE_ENV !== 'production' || process.env.E2E_NEWSROOM === 'true') {
    return '/api/media/local'
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.BETTER_AUTH_URL?.trim()
  const base = site || requestOrigin || 'http://localhost:3000'
  return `${base.replace(/\/+$/, '')}/api/media/local`
}

export function localMediaAbsolutePath(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, '').replace(/\.\./g, '')
  const full = path.resolve(UPLOAD_ROOT, normalized)
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error('Invalid media path.')
  }
  return full
}

export async function saveLocalMediaFile(input: {
  buffer: Buffer
  safeFilename: string
  contentType: string
  requestOrigin?: string
}): Promise<LocalMediaSaveResult> {
  const dir = path.join(UPLOAD_ROOT, NEWSROOM_DIR)
  await fs.mkdir(dir, { recursive: true })

  const hash = createHash('sha256').update(input.buffer).digest('hex').slice(0, 12)
  const ext = path.extname(input.safeFilename) || contentTypeExtension(input.contentType)
  const basename = path.basename(input.safeFilename, ext).slice(0, 60) || 'image'
  const filename = `${Date.now().toString(36)}-${hash}-${basename}${ext}`
  const relative = `${NEWSROOM_DIR}/${filename}`
  const absolute = localMediaAbsolutePath(relative)

  await fs.writeFile(absolute, input.buffer)

  const url = `${localMediaPublicBaseUrl(input.requestOrigin)}/${filename}`
  return {
    url,
    pathname: relative,
    bytes: input.buffer.length,
    contentType: input.contentType,
  }
}

export async function readLocalMediaFile(filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const safe = path.basename(filename)
  if (!safe || safe !== filename) return null
  const absolute = localMediaAbsolutePath(`${NEWSROOM_DIR}/${safe}`)
  try {
    const buffer = await fs.readFile(absolute)
    return { buffer, contentType: contentTypeFromExt(path.extname(safe)) }
  } catch {
    return null
  }
}

function contentTypeExtension(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    case 'image/avif':
      return '.avif'
    default:
      return '.bin'
  }
}

function contentTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}
