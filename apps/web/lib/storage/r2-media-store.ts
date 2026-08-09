import 'server-only'

type MediaR2Bucket = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob | null,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>
}

export type R2MediaSaveResult = {
  url: string
  pathname: string
  bytes: number
  contentType: string
}

/**
 * Persist a newsroom image to the Cloudflare R2 MEDIA_BUCKET binding.
 * Requires STORAGE_PUBLIC_BASE_URL (or R2_PUBLIC_BASE_URL) for a public object URL.
 */
export async function saveR2MediaFile(input: {
  buffer: Buffer
  safeFilename: string
  contentType: string
}): Promise<R2MediaSaveResult | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext({ async: true })
    const bucket = (env as { MEDIA_BUCKET?: MediaR2Bucket }).MEDIA_BUCKET
    if (!bucket) return null

    const key = `newsroom/${Date.now().toString(36)}-${input.safeFilename}`
    await bucket.put(key, input.buffer, {
      httpMetadata: { contentType: input.contentType },
    })

    const base =
      process.env.STORAGE_PUBLIC_BASE_URL?.trim() ||
      process.env.R2_PUBLIC_BASE_URL?.trim() ||
      ''
    if (!base) {
      throw new Error(
        'STORAGE_PUBLIC_BASE_URL (or R2_PUBLIC_BASE_URL) is required for public R2 media URLs.',
      )
    }

    return {
      url: `${base.replace(/\/+$/, '')}/${key}`,
      pathname: key,
      bytes: input.buffer.length,
      contentType: input.contentType,
    }
  } catch (error) {
    // Outside the Workers runtime (local next dev / Vercel) there is no binding.
    if (error instanceof Error) {
      const message = error.message
      const contextUnavailable =
        /getCloudflareContext.*(?:not|outside|unavailable|unsupported)/i.test(message) ||
        /Cloudflare context.*(?:not|outside|unavailable|unsupported|initialized)/i.test(message) ||
        message.includes('not been initialized')
      if (contextUnavailable) return null
    }
    throw error
  }
}
