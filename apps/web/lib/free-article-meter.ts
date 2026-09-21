export const FREE_ARTICLE_SESSION_LIMIT = 5
export const FREE_ARTICLE_METER_KEY = 'nw:membership:session-articles'
/**
 * The meter also rides in a session cookie.
 *
 * `sessionStorage` is invisible to the server, so a meter that lives only in
 * the browser cannot gate anything: the server would have already streamed the
 * full body before the client could count. The cookie is the same list, so the
 * article page can decide whether to render the body or the preview.
 *
 * It holds slugs the reader has already opened this session and nothing else —
 * no identifier, no cross-session persistence — which is what keeps it in the
 * strictly-necessary category rather than behind a consent toggle.
 */
export const FREE_ARTICLE_METER_COOKIE = 'nw_meter'

/** Longest key we will store or trust; keeps the cookie well inside 4KB. */
const MAX_KEY_LENGTH = 120

export function addArticleToSessionMeter(
  raw: string | null,
  articleKey: string,
  limit = FREE_ARTICLE_SESSION_LIMIT,
) {
  let current: string[] = []
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    if (Array.isArray(parsed)) current = parsed.map(String)
  } catch {}
  const articles = [...new Set([...current, articleKey])].slice(-limit)
  return {
    articles,
    count: articles.length,
    remaining: Math.max(0, limit - articles.length),
    limit,
  }
}

/** Cookie form: `a:b|c:d`. Anything unparseable reads as an empty meter. */
export function serializeMeter(articles: readonly string[]): string {
  return articles
    .filter((key) => key && key.length <= MAX_KEY_LENGTH && !key.includes('|'))
    .join('|')
}

export function parseMeter(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split('|')
    .map((key) => key.trim())
    .filter((key) => key.length > 0 && key.length <= MAX_KEY_LENGTH)
    .slice(-FREE_ARTICLE_SESSION_LIMIT)
}

/**
 * Free reads left *for this article*.
 *
 * An article already in the meter was paid for by an earlier slot, so re-opening
 * it — a refresh, a back button, a shared link the reader already followed —
 * never spends a second one. Anything else spends one now, which is why the
 * current key is excluded from the count rather than added to it.
 */
export function freeReadsRemainingFor(
  articles: readonly string[],
  articleKey: string,
  limit = FREE_ARTICLE_SESSION_LIMIT,
): number {
  const spent = articles.filter((key) => key !== articleKey).length
  return Math.max(0, limit - spent)
}

export function articleMeterKey(categorySlug: string, slug: string): string {
  return `${categorySlug}:${slug}`
}
