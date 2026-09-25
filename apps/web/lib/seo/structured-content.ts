/**
 * FAQPage and HowTo structured data, extracted from an article's own body.
 *
 * The catalog has claimed "auto-generated FAQ/HowTo schema" for a while with
 * nothing generating it. This does the generating, from content the newsroom
 * already writes: an explainer whose subheads are questions is an FAQ, and one
 * whose steps sit in an ordered list under a "कसरी…" / "how to…" subhead is a
 * HowTo. No new editor field, no new workflow.
 *
 * Precision over recall, deliberately. Structured data that does not match the
 * visible page is a manual-action risk, and a news site has much more to lose
 * from one than it stands to gain from an extra rich result. So a subhead only
 * counts as a question when it actually ends in a question mark, an answer has
 * to carry real text, and a body with a single pair emits nothing at all.
 *
 * Worth being straight about the payoff: Google retired HowTo rich results in
 * 2023 and now shows FAQ rich results only for authoritative government and
 * health sites, so on Google today this will usually change nothing visible.
 * It is still valid schema.org, still read by other engines and by the AI
 * crawlers that increasingly answer from it, and it costs a few hundred bytes
 * on pages that already qualify. That is the whole case for it.
 */
import type { ArticleBlock } from '@nagarikwatch/db'

/** Two questions is the smallest thing worth calling a FAQ. */
const MIN_FAQ_PAIRS = 2
/** Beyond this the markup stops being a summary of the page and starts being a copy of it. */
const MAX_FAQ_PAIRS = 10
/** An "answer" shorter than this is a stub, not an answer. */
const MIN_ANSWER_CHARS = 40
const MAX_ANSWER_CHARS = 1000
/** A single step is an instruction; two is a procedure. */
const MIN_HOWTO_STEPS = 2
const MAX_HOWTO_STEPS = 20

/** Both the ASCII and fullwidth question marks; Nepali copy uses the ASCII one. */
const QUESTION_MARK = /[?？]\s*$/u
/** Headings that introduce a procedure, in either language. */
const HOWTO_HEADING = /कसरी|how\s+to\b/iu

export type FaqPair = { question: string; answer: string }
export type HowTo = { name: string; steps: string[] }

/**
 * Drop the inline shorthand the body format allows (`**bold**`, `*italic*`,
 * `==highlight==`, `[label](href)`) so JSON-LD carries the words a reader sees
 * rather than the markup around them.
 *
 * Tolerates a missing string. `HeadingBlock.text` and `ParagraphBlock.text` are
 * required by the type, but a stored row is not type-checked: a legacy record,
 * a half-migrated CMS document or a hand-edited JSON store can carry a block
 * without one. Before this guard, a single such block threw inside the article
 * page's render, and the route-level loading boundary committed a 200 with the
 * error UI in place of the story — a broken page that no status check, no
 * monitor and no crawler could see. Structured data is a decoration; it must
 * not be able to take the page it decorates down with it.
 */
export function stripInline(text: string | null | undefined): string {
  if (typeof text !== 'string') return ''
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/(\*\*|==|\*)(.+?)\1/gu, '$2')
    .replace(/\s+/gu, ' ')
    .trim()
}

type Section = { heading: string; blocks: ArticleBlock[] }

/** Split a body into heading-led sections. Any heading closes the previous one. */
function sections(blocks: readonly ArticleBlock[]): Section[] {
  const out: Section[] = []
  for (const block of blocks) {
    if (block.type === 'heading2' || block.type === 'heading3') {
      out.push({ heading: stripInline(block.text), blocks: [] })
      continue
    }
    out[out.length - 1]?.blocks.push(block)
  }
  return out
}

/** Prose under a heading, flattened. Pull quotes and captions are not answers. */
function answerText(blocks: readonly ArticleBlock[]): string {
  const parts: string[] = []
  for (const block of blocks) {
    if (block.type === 'paragraph') parts.push(stripInline(block.text))
    else if (block.type === 'list') parts.push(block.items.map(stripInline).join(' '))
  }
  const joined = parts.filter(Boolean).join(' ').trim()
  if (joined.length <= MAX_ANSWER_CHARS) return joined
  // Cut at a word boundary so the answer does not end mid-word.
  const cut = joined.slice(0, MAX_ANSWER_CHARS)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > MAX_ANSWER_CHARS / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Question/answer pairs in a body, or an empty array when it is not an FAQ.
 * Callers should treat an empty array as "emit nothing", not "emit an empty
 * FAQPage" — a FAQPage with no questions is invalid.
 */
export function extractFaqPairs(blocks: readonly ArticleBlock[] | undefined): FaqPair[] {
  const pairs: FaqPair[] = []
  for (const section of sections(blocks ?? [])) {
    if (!QUESTION_MARK.test(section.heading)) continue
    const answer = answerText(section.blocks)
    if (answer.length < MIN_ANSWER_CHARS) continue
    pairs.push({ question: section.heading, answer })
    if (pairs.length === MAX_FAQ_PAIRS) break
  }
  return pairs.length >= MIN_FAQ_PAIRS ? pairs : []
}

/**
 * The first procedure in a body, or null. Requires both signals — a heading
 * that announces a procedure and an ordered list under it — because either one
 * alone is common in ordinary reporting.
 */
export function extractHowTo(blocks: readonly ArticleBlock[] | undefined): HowTo | null {
  for (const section of sections(blocks ?? [])) {
    if (!HOWTO_HEADING.test(section.heading)) continue
    const list = section.blocks.find((block) => block.type === 'list' && block.ordered)
    if (!list || list.type !== 'list') continue
    const steps = list.items.map(stripInline).filter(Boolean).slice(0, MAX_HOWTO_STEPS)
    if (steps.length < MIN_HOWTO_STEPS) continue
    return { name: section.heading.replace(QUESTION_MARK, '').trim(), steps }
  }
  return null
}
