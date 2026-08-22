import { NextResponse } from 'next/server'
import { buildPublicArticleWhere } from '@nagarikwatch/db'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { isPayloadStorageWired } from '@/lib/storage-adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function databaseFailureDetail(error: unknown): { code: string; detail: string } {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''
  const message = error instanceof Error ? error.message : String(error)

  if (code === 'ENOTFOUND') {
    return {
      code,
      detail:
        'Postgres DNS lookup failed. Check the database hostname and provider network status.',
    }
  }
  if (code === '28P01' || /password authentication failed/i.test(message)) {
    return { code: code || 'AUTH', detail: 'Postgres rejected the configured username/password.' }
  }
  if (code === '53300' || /too many connections|remaining connection slots/i.test(message)) {
    return { code: code || 'CAPACITY', detail: 'Postgres connection capacity is exhausted.' }
  }
  if (/self-signed certificate|certificate|tls|ssl/i.test(message)) {
    return {
      code: code || 'SSL',
      detail: 'Postgres TLS negotiation failed. Check provider CA/sslmode settings.',
    }
  }
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    return {
      code,
      detail: `Postgres connection failed (${code}). Check network access and provider availability.`,
    }
  }
  return {
    code: code || 'CONNECT',
    detail: `Postgres/Payload initialization failed: ${message.slice(0, 180)}`,
  }
}

export async function GET() {
  const started = Date.now()
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const [categories, publicArticles, publicationDrift, publicationTimingDrift] =
      await Promise.all([
        payload.count({ collection: 'categories', overrideAccess: true }),
        payload.count({
          collection: 'articles',
          overrideAccess: true,
          where: buildPublicArticleWhere(now) as Where,
        }),
        payload.count({
          collection: 'articles',
          overrideAccess: true,
          where: {
            and: [
              { _status: { equals: 'draft' } },
              { workflowStage: { in: ['scheduled', 'published', 'updated'] } },
            ],
          },
        }),
        payload.count({
          collection: 'articles',
          overrideAccess: true,
          where: {
            and: [
              { _status: { equals: 'published' } },
              { workflowStage: { in: ['scheduled', 'published', 'updated'] } },
              { publishAt: { exists: false } },
            ],
          },
        }),
      ])
    const storageReady = isPayloadStorageWired()
    return NextResponse.json(
      {
        status: storageReady || process.env.NODE_ENV !== 'production' ? 'ok' : 'degraded',
        service: 'nagarik-watch-admin',
        database: 'reachable',
        content: {
          categories: categories.totalDocs,
          publicArticles: publicArticles.totalDocs,
          publicationDrift: publicationDrift.totalDocs,
          publicationTimingDrift: publicationTimingDrift.totalDocs,
        },
        mediaStorage: storageReady ? 'vercel-blob' : 'missing',
        mediaUploadReady: storageReady,
        configurationHint: storageReady
          ? undefined
          : 'Attach a Vercel Blob store to the Payload project so BLOB_READ_WRITE_TOKEN exists in this deployment.',
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined,
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
      },
      {
        status: storageReady || process.env.NODE_ENV !== 'production' ? 200 : 503,
        headers: { 'cache-control': 'no-store, max-age=0' },
      },
    )
  } catch (error) {
    console.error('[health] admin database check failed', error)
    const failure = databaseFailureDetail(error)
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'nagarik-watch-admin',
        database: 'unreachable',
        databaseCode: failure.code,
        detail: failure.detail,
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
      },
      { status: 503, headers: { 'cache-control': 'no-store, max-age=0' } },
    )
  }
}
