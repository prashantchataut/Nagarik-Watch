/**
 * AI features scaffold (Phase 9).
 *
 * HARD POLICY (PRODUCT.md + spec Phase 9):
 *   - AI output is ALWAYS a draft. Nothing auto-publishes.
 *   - Every result carries `needsEditorApproval: true` until an editor signs off.
 *   - AI never fabricates sources. Fact-check assistance surfaces evidence
 *     fields that the editor must fill; the AI does not invent citations.
 *   - Every AI-touched article gets an audit-log entry.
 *
 * Two execution modes:
 *   - `extractive` (default, no key needed): deterministic heuristics that pull
 *     real signal from the article text. Honest and cheap, never hallucinates.
 *   - `llm` (when AI_PROVIDER_KEY is wired): calls a provider through the
 *     AiProvider interface. The editor still approves before publish.
 *
 * The extractive implementations are real and useful today; the LLM path is a
 * typed seam waiting for a key. Nothing here pretends to be more than it is.
 */
import type { Article, ArticleBlock } from '@nagarikwatch/db'

export type AiDraftStatus = 'draft' | 'approved' | 'rejected'

export type AiDraft<T> = {
  status: AiDraftStatus
  needsEditorApproval: true
  generatedBy: 'extractive' | 'llm'
  generatedAt: string
  model?: string
  data: T
}

export type AiProvider = {
  name: string
  summarize(text: string, locale: 'ne' | 'en'): Promise<string>
  suggestHeadlines(text: string, locale: 'ne' | 'en'): Promise<string[]>
  suggestTags(text: string): Promise<string[]>
}

/** Flatten an article's body blocks into a single plain-text string for analysis. */
export function articleToText(article: Pick<Article, 'bodyNe' | 'titleNe' | 'deckNe'>): string {
  const parts: string[] = [article.titleNe]
  if (article.deckNe) parts.push(article.deckNe)
  for (const block of article.bodyNe ?? []) {
    parts.push(blockText(block))
  }
  return parts.filter(Boolean).join('\n\n')
}

function blockText(block: ArticleBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading2':
    case 'heading3':
      return block.text
    case 'pullQuote':
      return block.quoteNe
    case 'list':
      return block.items.join(' ')
    case 'image':
    case 'embed':
    case 'adSlot':
      return ''
  }
}

/** Split text into sentences. Handles Devanagari danda (।) and Latin stops. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[।.!?])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const STOPWORDS_NE = new Set([
  'र', 'को', 'मा', 'ले', 'लाई', 'का', 'गर्न', 'भएको', 'छ', 'हो', 'यो', 'त्यो',
  'गरेको', 'गर्दा', 'हुने', 'भने', 'अब', 'पनि', 'गर्', 'एक',
])
const STOPWORDS_EN = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
  'this', 'that', 'it', 'as', 'said', 'says',
])

/** Extractive summary: pick the first 2 sentences with the highest term density
 *  relative to the full text. Cheap, deterministic, never invents content. */
export function draftSummary(
  article: Pick<Article, 'bodyNe' | 'titleNe' | 'deckNe'>,
  maxSentences = 2,
): AiDraft<string> {
  const text = articleToText(article)
  const sentences = splitSentences(text)
  if (sentences.length === 0) {
    return emptyDraft('')
  }
  if (sentences.length <= maxSentences) {
    return makeDraft(sentences.join(' '))
  }

  const termFreq = new Map<string, number>()
  for (const word of tokenize(text)) {
    termFreq.set(word, (termFreq.get(word) ?? 0) + 1)
  }

  const scored = sentences.map((s, i) => {
    let score = 0
    for (const word of tokenize(s)) {
      score += termFreq.get(word) ?? 0
    }
    // Position bias: lead sentences carry more weight (news pyramid).
    score *= 1 / (1 + i * 0.3)
    return { s, i, score }
  })

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
    .join(' ')

  return makeDraft(top)
}

/** Extractive key-points: the top-N sentences by term density, as a list. */
export function draftKeyPoints(
  article: Pick<Article, 'bodyNe' | 'titleNe' | 'deckNe'>,
  count = 4,
): AiDraft<string[]> {
  const text = articleToText(article)
  const sentences = splitSentences(text)
  if (sentences.length === 0) return emptyDraft([])

  const termFreq = new Map<string, number>()
  for (const word of tokenize(text)) termFreq.set(word, (termFreq.get(word) ?? 0) + 1)

  const points = sentences
    .map((s, i) => ({
      s: truncate(s, 140),
      i,
      score: tokenize(s).reduce((acc, w) => acc + (termFreq.get(w) ?? 0), 0) * (1 / (1 + i * 0.2)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)

  return makeDraft(points)
}

/** Headline suggestions: extractive alternates built from the deck + lead.
 *  Not creative LLM rewrites — real sub-strings of the article, presented as
 *  starting points the editor rewrites. Honest about what they are. */
export function draftHeadlines(
  article: Pick<Article, 'titleNe' | 'deckNe' | 'bodyNe'>,
  count = 3,
): AiDraft<string[]> {
  const candidates: string[] = []
  if (article.deckNe) candidates.push(truncate(article.deckNe, 80))
  const firstPara = (article.bodyNe ?? []).find((b) => b.type === 'paragraph')
  if (firstPara && firstPara.type === 'paragraph') candidates.push(truncate(firstPara.text, 80))
  if (article.titleNe) candidates.push(article.titleNe)

  return makeDraft(Array.from(new Set(candidates)).slice(0, count))
}

/** Tag suggestions: top frequent non-stopword terms, de-duplicated. */
export function draftTags(
  article: Pick<Article, 'bodyNe' | 'titleNe' | 'deckNe'>,
  count = 6,
): AiDraft<string[]> {
  const text = articleToText(article)
  const freq = new Map<string, number>()
  for (const word of tokenize(text)) {
    if (STOPWORDS_NE.has(word) || STOPWORDS_EN.has(word)) continue
    if (word.length < 3) continue
    freq.set(word, (freq.get(word) ?? 0) + 1)
  }
  const tags = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w)
  return makeDraft(tags)
}

/** Duplicate detection: near-duplicate flag via Jaccard similarity on token
 *  sets. Returns pairs above the threshold so an editor can investigate. */
export function detectDuplicates(
  candidates: Array<Pick<Article, 'id' | 'titleNe' | 'bodyNe' | 'deckNe'>>,
  threshold = 0.45,
): Array<{ a: string; b: string; similarity: number }> {
  const tokenized = candidates.map((c) => ({ id: c.id, tokens: new Set(tokenize(articleToText(c))) }))
  const pairs: Array<{ a: string; b: string; similarity: number }> = []
  for (let i = 0; i < tokenized.length; i++) {
    const a = tokenized[i]
    if (!a) continue
    for (let j = i + 1; j < tokenized.length; j++) {
      const b = tokenized[j]
      if (!b) continue
      const sim = jaccard(a.tokens, b.tokens)
      if (sim >= threshold) pairs.push({ a: a.id, b: b.id, similarity: sim })
    }
  }
  return pairs.sort((a, b) => b.similarity - a.similarity)
}

/** Fact-check assistance: returns an EMPTY claim scaffold for the editor to
 *  fill. The AI does not assert verdicts or invent sources — it structures the
 *  review so a human fills the evidence. */
export type FactCheckScaffold = {
  claims: Array<{
    claim: string
    claimant: string
    evidence: string
    sources: Array<{ url: string; label: string }>
    verdict: '' | 'verified' | 'false' | 'mixed' | 'context_needed'
  }>
}

export function draftFactCheckScaffold(
  article: Pick<Article, 'bodyNe' | 'titleNe'>,
): AiDraft<FactCheckScaffold> {
  const sentences = splitSentences(articleToText(article)).slice(0, 5)
  return makeDraft({
    claims: sentences.map((s) => ({
      claim: s,
      claimant: '',
      evidence: '',
      sources: [],
      verdict: '' as const,
    })),
  })
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter += 1
  return inter / (a.size + b.size - inter)
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : n)}…`
}

function makeDraft<T>(data: T): AiDraft<T> {
  return {
    status: 'draft',
    needsEditorApproval: true,
    generatedBy: 'extractive',
    generatedAt: new Date().toISOString(),
    data,
  }
}

function emptyDraft<T>(data: T): AiDraft<T> {
  return makeDraft(data)
}

/** Roadmap of features that require an LLM provider key (AI_PROVIDER_KEY).
 *  Extractive versions ship now; these land when a key is configured. */
export const AI_FEATURE_ROADMAP = [
  'summary-extractive (live)',
  'key-points-extractive (live)',
  'headline-suggestions-extractive (live)',
  'tag-suggestions-extractive (live)',
  'duplicate-detection (live)',
  'fact-check-scaffold (live, editor fills evidence)',
  'llm-summary (needs AI_PROVIDER_KEY)',
  'llm-headline-rewrite (needs AI_PROVIDER_KEY)',
  'seo-meta-suggestions (needs AI_PROVIDER_KEY)',
  'translation-draft-ne-en (needs AI_PROVIDER_KEY)',
  'voice-search (needs speech provider)',
  'text-to-speech-audio-article (needs TTS provider)',
  'comment-moderation-assistant (needs moderation model)',
] as const
