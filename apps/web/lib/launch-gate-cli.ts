import {
  evaluateLaunchEnvChecks,
  launchGateExitCode,
  liveBlockerMessages,
} from './launch-gate-core'

const live = (process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview').toLowerCase() === 'live'
const checks = evaluateLaunchEnvChecks(process.env)
const blockers = liveBlockerMessages(checks)
const warnings = checks.filter((check) => check.status === 'warn').map((check) => check.detail)

if (warnings.length) {
  console.warn('Launch gate warnings:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}

const exitCode = launchGateExitCode(checks, live)
if (exitCode !== 0) {
  console.error('Launch gate failed:')
  for (const blocker of blockers) console.error(`- ${blocker}`)
  process.exit(1)
}

if (!live && blockers.length) {
  console.warn(
    `${blockers.length} live blocker(s) remain (not enforced until NEXT_PUBLIC_LAUNCH_STATUS=live):`,
  )
  for (const blocker of blockers) console.warn(`- ${blocker}`)
}

console.log(
  live
    ? 'Launch gate passed.'
    : 'Launch gate passed preview checks. Strict live blockers are reported as warnings until NEXT_PUBLIC_LAUNCH_STATUS=live.',
)
