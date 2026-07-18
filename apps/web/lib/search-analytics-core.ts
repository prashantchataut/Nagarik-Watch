export function sanitizeSearchQuery(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/(?:\+?\d[\s().-]*){8,}/g, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

export function normalizeSearchQuery(value: unknown): string {
  return sanitizeSearchQuery(value).toLocaleLowerCase('und')
}

export function validSearchResultCount(value: unknown): number {
  const count = Number(value)
  if (!Number.isFinite(count)) return 0
  return Math.max(0, Math.min(10_000, Math.floor(count)))
}

