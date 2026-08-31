/**
 * S3-compatible storage — zero-dependency AWS SigV4 client.
 * Supports Cloudflare R2 and Void Drive (or any S3 provider) via generic STORAGE_* vars.
 *
 * Env (Void Drive / generic S3 — preferred):
 *   STORAGE_ENDPOINT          → e.g. https://s3.void.dev or https://gateway.voiddrive.com
 *   STORAGE_ACCESS_KEY_ID     (required)
 *   STORAGE_SECRET_ACCESS_KEY (required)
 *   STORAGE_BUCKET            (required)
 *   STORAGE_PUBLIC_BASE_URL   (required for public URLs) e.g. https://cdn.nagarikwatch.com
 *
 * Env (Cloudflare R2 — legacy compat):
 *   R2_ACCOUNT_ID        → endpoint https://{id}.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   R2_PUBLIC_BASE_URL
 *
 * When no group is fully configured the module reports "not configured".
 * Keys are never logged — errors redact credentials.
 */

import { createHash, createHmac } from 'node:crypto'

const R2_REGION = 'auto'
const SERVICE = 's3'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
  /** Resolved HTTPS host for SigV4, e.g. gateway.voiddrive.com or {id}.r2.cloudflarestorage.com */
  host: string
  region: string
}

// Generic S3 config (Void Drive) — preferred when STORAGE_* is set
export interface GenericS3Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
  host: string
  region: string
}

export type StorageConfig = (R2Config & { kind: 'r2' }) | (GenericS3Config & { kind: 'void' })

function hostFromEndpoint(endpoint: string): { host: string; region: string } {
  try {
    const u = new URL(endpoint)
    return { host: u.hostname, region: u.hostname.includes('r2.cloudflarestorage.com') ? 'auto' : 'us-east-1' }
  } catch {
    return { host: endpoint.replace(/^https?:\/\//, '').replace(/\/+$/, ''), region: 'us-east-1' }
  }
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) return null
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
    host: `${accountId}.r2.cloudflarestorage.com`,
    region: R2_REGION,
    kind: 'r2' as const,
  } as R2Config & { kind: 'r2' }
}

function getVoidConfig(): (GenericS3Config & { kind: 'void' }) | null {
  const endpoint = process.env.STORAGE_ENDPOINT?.trim()
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.STORAGE_BUCKET?.trim()
  const publicBaseUrl = (
    process.env.STORAGE_PUBLIC_BASE_URL?.trim() || process.env.R2_PUBLIC_BASE_URL?.trim() || ''
  ).trim()
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) return null
  const { host, region } = hostFromEndpoint(endpoint)
  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
    host,
    region,
    kind: 'void' as const,
  }
}

export function getStorageConfig(): StorageConfig | null {
  return getVoidConfig() ?? (getR2Config() as StorageConfig | null)
}

export function isR2Configured(): boolean {
  return getStorageConfig() !== null
}

/* ----------------------------- SigV4 helpers ----------------------------- */

function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

/** Encode a full URI path, keeping "/" separators (S3 canonical form). */
function canonicalUriPath(key: string): string {
  return (
    '/' +
    key
      .split('/')
      .map((seg) =>
        seg.replace(/[^A-Za-z0-9\-._~]/g, (ch) =>
          '%' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'),
        ),
      )
      .join('/')
  )
}

function signedHeadersAndCanonicalHeaders(
  host: string,
  amzDate: string,
  payloadHash: string,
  contentType: string,
) {
  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  if (contentType) headers['content-type'] = contentType
  const names = Object.keys(headers).sort()
  const canonical = names.map((n) => `${n}:${headers[n]!}\n`).join('')
  const signedList = names.join(';')
  return { canonical, signedList }
}

/* ------------------------------ Public API ------------------------------- */

export interface UploadResult {
  key: string
  url: string
  bytes: number
  contentType: string
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export function validateImageUpload(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.has(file.type))
    return `असमर्थित फाइल प्रकार (${file.type || 'unknown'})। JPEG/PNG/WebP/GIF/AVIF मात्र।`
  if (file.size > MAX_BYTES) return `फाइल ८ MB भन्दा ठूलो (${(file.size / 1048576).toFixed(1)} MB)।`
  if (file.size < 1024) return 'फाइल एकदम सानो/खाली जस्तो छ।'
  return null
}

function safeExtension(type: string, providedName: string): string {
  const fromName = providedName.includes('.')
    ? providedName.split('.').pop()!.toLowerCase()
    : ''
  const byType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  }
  const wanted = byType[type] ?? 'jpg'
  const ok = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'])
  return ok.has(fromName) ? (fromName === 'jpeg' ? 'jpg' : fromName) : wanted
}

/** Build the object key for an upload: uploads/<desk>/<yyyy>/<mm>/<rand>.<ext> */
export function buildObjectKey(desk: string, fileName: string, type: string): string {
  const now = new Date()
  const rand = Math.random().toString(36).slice(2, 10)
  const ext = safeExtension(type, fileName)
  const safeDesk = desk.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'desk'
  return `uploads/${safeDesk}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${rand}.${ext}`
}

/**
 * PUT an object using S3 SigV4 (path-style). Works for R2 and Void Drive.
 * Throws Error with a Nepali-readable message on failure — never includes credentials.
 */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<UploadResult> {
  const cfg = getStorageConfig() ?? getR2Config()
  if (!cfg) throw new Error('स्टोरेज सेटअप नपुगेको — STORAGE_* वा R2_* परिवेश चरहरू हेर्नुहोस्।')

  const host = (cfg as { host: string }).host
  const payloadHash = sha256Hex(body)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '') // 20260831T041530Z
  const dateStamp = amzDate.slice(0, 8)

  const { canonical, signedList } = signedHeadersAndCanonicalHeaders(
    host,
    amzDate,
    payloadHash,
    contentType,
  )

  const canonicalUri = canonicalUriPath(`${cfg.bucket}/${key}`)
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonical}\n${signedList}\n${payloadHash}`

  const region = (cfg as { region: string }).region || R2_REGION
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${sha256Hex(canonicalRequest)}`

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, SERVICE)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedList}, Signature=${signature}`

  const url = `https://${host}${canonicalUri}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'content-type': contentType,
      'content-length': String(body.byteLength),
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`स्टोरेज अपलोड असफल (HTTP ${res.status}) ${text.slice(0, 160)}`)
  }

  return {
    key,
    url: `${cfg.publicBaseUrl}/${key}`,
    bytes: body.byteLength,
    contentType,
  }
}

/** Public URL for an existing key (assumes bucket is exposed publicly). */
export function publicUrl(key: string): string | null {
  const cfg = getStorageConfig() ?? getR2Config()
  if (!cfg) return null
  return `${cfg.publicBaseUrl}/${key}`
}
