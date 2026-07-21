/** Minimal pg stub for Cloudflare Workers free-tier bundles (real pg is ~500KB+). */
export class Pool {
  totalCount = 0
  idleCount = 0
  waitingCount = 0

  constructor(_config?: unknown) {}

  on(_event: string, _listener: (...args: unknown[]) => void) {
    return this
  }

  async query(): Promise<never> {
    throw new Error('Postgres client is not bundled on Cloudflare Workers free tier.')
  }

  async connect(): Promise<never> {
    throw new Error('Postgres client is not bundled on Cloudflare Workers free tier.')
  }

  async end(): Promise<void> {}
}

export type PoolClient = {
  query: Pool['query']
  release: () => void
}

export type QueryResultRow = Record<string, unknown>
export type QueryResult<T extends QueryResultRow = QueryResultRow> = { rows: T[] }
export type PoolConfig = Record<string, unknown>
