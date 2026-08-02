/**
 * Soft-launch origin assert — fails if someone tries to declare live on a static export.
 * Usage: node scripts/assert-launch-origin.mjs
 * Also run automatically when NEXT_PUBLIC_LAUNCH_STATUS=live via launch-gate.mjs.
 */
const live = (process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview').toLowerCase() === 'live'
const staticExport =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === '1' ||
  process.env.CF_PAGES_STATIC === '1' ||
  String(process.env.NEXT_PUBLIC_STATIC_EXPORT || '').toLowerCase() === 'true'

if (staticExport && live) {
  console.error(
    'Launch origin assert failed: NEXT_PUBLIC_LAUNCH_STATUS=live is incompatible with static Pages export (ADR-004).',
  )
  process.exit(1)
}

if (staticExport) {
  console.warn(
    'Static export flags are set — this build cannot host APIs. Use for preview only (docs/launch-runbook.md).',
  )
} else {
  console.log(
    live
      ? 'Launch origin assert: Node host assumed for live status.'
      : 'Launch origin assert: preview on Node-capable host (ok).',
  )
}
