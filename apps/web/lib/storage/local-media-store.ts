import 'server-only'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Local filesystem media is a development / E2E adapter only.
 * On Vercel, uploads must use Blob/R2 — never ship cwd-traced upload trees
 * into serverless functions (NFT follows process.cwd() and can exceed 250MB).
 */
const NEWSROOM_DIR = 'newsroom'

/** Resolve upload root without `process.cwd()` so NFT does not pack the monorepo. */
function uploadRoot(): string {
  const configured = process.env.LOCAL_MEDIA_DIR?.trim()
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.resolve(configured)
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(process.env.TMPDIR || '/tmp', 'nw-media')
  }
  // apps/web/.data/uploads — anchored to this module, not the process cwd.
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.data/uploads')
}

export type LocalMediaSaveResult = {
  url: string
  pathname: string
  bytes: number
  contentType: string
}

export function localMediaAllowed(): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return false
  return (
    process.env.ALLOW_LOCAL_MEDIA === 'true' ||
    process.env.E2E_NEWSROOM === 'true' ||
    process.env.NODE_ENV !== 'production'
  )
}

export function localMediaPublicBaseUrl(requestOrigin?: string): string {
  const configured = process.env.STORAGE_PUBLIC_BASE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  if (localMediaAllowed()) {
    return '/api/media/local'
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.BETTER_AUTH_URL?.trim()
  const base = site || requestOrigin || 'http://localhost:3000'
  return `${base.replace(/\/+$/, '')}/api/media/local`
}

export function localMediaAbsolutePath(relativePath: string): string {
  const root = uploadRoot()
  const normalized = relativePath.replace(/^\/+/, '').replace(/\.\./g, '')
  const full = path.resolve(root, normalized)
  if (!full.startsWith(root)) {
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
  if (!localMediaAllowed()) {
    throw new Error('Local filesystem media is disabled in this environment. Configure BLOB_READ_WRITE_TOKEN.')
  }

  const dir = path.join(uploadRoot(), NEWSROOM_DIR)
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

export async function readLocalMediaFile(
  filename: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!localMediaAllowed()) return null
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
