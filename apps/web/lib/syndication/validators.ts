/**
 * Local, dependency-free structural validators for AMP, Facebook Instant
 * Articles, and Apple News Format. None of these call a vendor API — they
 * check the same structural fields the algorithms catalog already claims to
 * check (amp-html-validation, instant-articles-check, apple-news-format) so
 * the admin SEO page and the catalog runtime share one honest implementation.
 */

export type ValidationResult = {
  ok: boolean
  issues: string[]
}

function result(issues: string[]): ValidationResult {
  return { ok: issues.length === 0, issues }
}

export type AmpValidationInput = {
  hasCanonical: boolean
  hasHeroImage: boolean
  hasAmpBoilerplate?: boolean
}

/** Minimum structural checks an AMP-style fast page needs before Google's cache will serve it. */
export function validateAmpHtml(input: AmpValidationInput): ValidationResult {
  const issues: string[] = []
  if (!input.hasCanonical) issues.push('Missing <link rel="canonical"> back to the standard page.')
  if (!input.hasHeroImage)
    issues.push('Missing a hero image block (amp-img requires explicit width/height).')
  if (input.hasAmpBoilerplate === false)
    issues.push('Missing the AMP boilerplate <style amp-boilerplate> tag.')
  return result(issues)
}

export type InstantArticleInput = {
  title: string
  bodyBlockCount: number
  hasCanonical: boolean
}

/** Facebook Instant Articles require a non-empty headline, body content, and a canonical link. */
export function validateInstantArticle(input: InstantArticleInput): ValidationResult {
  const issues: string[] = []
  if (!input.title.trim()) issues.push('Missing headline.')
  if (input.bodyBlockCount <= 0) issues.push('Article has no body blocks to export.')
  if (!input.hasCanonical) issues.push('Missing canonical link back to the origin article.')
  return result(issues)
}

export type AppleNewsFormatInput = {
  hasIdentifier: boolean
  hasTitle: boolean
  hasComponents: boolean
}

/** Apple News Format documents need an identifier, title, and at least one component. */
export function validateAppleNewsFormat(input: AppleNewsFormatInput): ValidationResult {
  const issues: string[] = []
  if (!input.hasIdentifier) issues.push('Missing document identifier.')
  if (!input.hasTitle) issues.push('Missing title.')
  if (!input.hasComponents) issues.push('Missing at least one body component.')
  return result(issues)
}
