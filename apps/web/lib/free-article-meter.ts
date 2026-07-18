export const FREE_ARTICLE_SESSION_LIMIT = 5
export const FREE_ARTICLE_METER_KEY = 'nw:membership:session-articles'

export function addArticleToSessionMeter(raw: string | null, articleKey: string, limit = FREE_ARTICLE_SESSION_LIMIT) {
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
