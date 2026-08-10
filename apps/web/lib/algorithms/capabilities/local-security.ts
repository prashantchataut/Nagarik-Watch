import type { CapabilitySpec } from '../types'
import { num, str, clamp01, okLocal, okAdapter } from '../handlers/utils'
import { botScore } from '../product/traffic-quality'
import { surfaceFor } from './surface'

const WAF_PATTERNS = [
  /union\s+select/i,
  /<script[\s>]/i,
  /\.\.\/\.\.\//,
  /or\s+1\s*=\s*1/i,
  /drop\s+table/i,
]

export const LOCAL_SECURITY_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'token-bucket-rate-limiting',
    surface: surfaceFor('token-bucket-rate-limiting'),
    mode: 'local',
    run: (input) => {
      const capacity = num(input, 'bucketCapacity', 20)
      const refillPerSecond = num(input, 'refillPerSecond', 2)
      const secondsSinceLastRequest = num(input, 'secondsSinceLastRequest', 5)
      const tokensBefore = num(input, 'tokensBefore', 10)
      const tokensAvailable = Math.min(
        capacity,
        tokensBefore + refillPerSecond * secondsSinceLastRequest,
      )
      const allowed = tokensAvailable >= 1
      return okLocal(
        `tokensAvailable=${tokensAvailable.toFixed(1)}/${capacity} allowed=${allowed}`,
        {
          score: clamp01(tokensAvailable / capacity),
        },
      )
    },
  },
  {
    id: 'waf-rule-engine',
    surface: surfaceFor('waf-rule-engine'),
    mode: 'adapter-disabled',
    run: (input) => {
      const payload = str(input, 'requestPayload', 'category=politics&sort=latest')
      const matched = WAF_PATTERNS.filter((re) => re.test(payload))
      const blocked = matched.length > 0
      return okAdapter(
        'adapter-disabled',
        `localWafMatches=${matched.length} blocked=${blocked} (no managed WAF vendor configured)`,
        {
          score: blocked ? 1 : 0,
        },
      )
    },
  },
  {
    id: 'behavioral-bot-score',
    surface: surfaceFor('behavioral-bot-score'),
    mode: 'local',
    run: (input) => {
      const score = botScore({
        requestsPerMinute: num(input, 'requestsPerMinute', 6),
        jsExecuted: Boolean(input.jsExecuted ?? true),
        mouseMovements: num(input, 'mouseMovements', 24),
        headlessUserAgent: Boolean(input.headlessUserAgent),
        knownDatacenterIp: Boolean(input.knownDatacenterIp),
        sessionDurationSeconds: num(input, 'sessionDurationSeconds', 95),
        pagesPerSession: num(input, 'pagesPerSession', 3),
      })
      return okLocal(`behavioralBotScore=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'invisible-bot-challenge',
    surface: surfaceFor('invisible-bot-challenge'),
    mode: 'adapter-disabled',
    run: (input) => {
      const jsExecuted = Boolean(input.jsExecuted ?? true)
      const timingConsistentMs = num(input, 'challengeSolveMs', 40)
      const passed = jsExecuted && timingConsistentMs > 5 && timingConsistentMs < 2000
      return okAdapter(
        'adapter-disabled',
        `invisibleChallengePassed=${passed} (local timing probe, no vendor CAPTCHA configured)`,
        {
          score: passed ? 1 : 0,
        },
      )
    },
  },
  {
    id: 'tls-resumption-ocsp',
    surface: surfaceFor('tls-resumption-ocsp'),
    mode: 'adapter-disabled',
    run: (input) => {
      const resumedSessions = num(input, 'resumedSessions', 60)
      const totalSessions = num(input, 'totalSessions', 100)
      const ocspStapled = Boolean(input.ocspStapled ?? true)
      const resumptionRate = totalSessions > 0 ? clamp01(resumedSessions / totalSessions) : 0
      return okAdapter(
        'adapter-disabled',
        `tlsResumptionRate=${resumptionRate.toFixed(3)} ocspStapled=${ocspStapled} (no edge TLS vendor configured)`,
        {
          score: resumptionRate,
        },
      )
    },
  },
  {
    id: 'auto-generated-csp',
    surface: surfaceFor('auto-generated-csp'),
    mode: 'local',
    run: (input) => {
      const directives = (input.cspDirectives as Record<string, string>) ?? {
        'default-src': "'self'",
        'script-src': "'self'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
      }
      const required = ['default-src', 'script-src', 'style-src', 'img-src']
      const present = required.filter((d) => Boolean(directives[d])).length
      const score = present / required.length
      return okLocal(`cspDirectivesPresent=${present}/${required.length}`, { score })
    },
  },
  {
    id: 'credential-stuffing-detection',
    surface: surfaceFor('credential-stuffing-detection'),
    mode: 'local',
    run: (input) => {
      const failedLoginsPerMinute = num(input, 'failedLoginsPerMinute', 3)
      const distinctUsernamesTried = num(input, 'distinctUsernamesTried', 3)
      const suspicious = failedLoginsPerMinute > 10 && distinctUsernamesTried > 5
      const score = clamp01(failedLoginsPerMinute / 20) * clamp01(distinctUsernamesTried / 10)
      return okLocal(
        `credentialStuffingRisk=${suspicious} failedLoginsPerMin=${failedLoginsPerMinute}`,
        { score },
      )
    },
  },
  {
    id: 'dependency-vulnerability-scanning',
    surface: surfaceFor('dependency-vulnerability-scanning'),
    mode: 'local',
    run: (input) => {
      const vulnerableDeps = num(input, 'vulnerableDeps', 0)
      const totalDeps = num(input, 'totalDeps', 400)
      const score = totalDeps > 0 ? clamp01(1 - vulnerableDeps / totalDeps) : 1
      return okLocal(`vulnerableDeps=${vulnerableDeps}/${totalDeps}`, { score })
    },
  },
  {
    id: 'scheduled-secret-rotation',
    surface: surfaceFor('scheduled-secret-rotation'),
    mode: 'adapter-disabled',
    run: (input) => {
      const secretAgeDays = num(input, 'secretAgeDays', 45)
      const rotationPolicyDays = num(input, 'rotationPolicyDays', 90)
      const overdue = secretAgeDays > rotationPolicyDays
      return okAdapter(
        'adapter-disabled',
        `secretRotationOverdue=${overdue} age=${secretAgeDays}d policy=${rotationPolicyDays}d (no secrets-manager vendor configured)`,
        {
          score: overdue ? 1 : clamp01(secretAgeDays / rotationPolicyDays),
        },
      )
    },
  },
  {
    id: 'error-spike-auto-rollback',
    surface: surfaceFor('error-spike-auto-rollback'),
    mode: 'adapter-disabled',
    run: (input) => {
      const currentErrorRate = num(input, 'currentErrorRate', 0.01)
      const baselineErrorRate = num(input, 'baselineErrorRate', 0.008)
      const spikeRatio = baselineErrorRate > 0 ? currentErrorRate / baselineErrorRate : 1
      const shouldRollback = spikeRatio >= 3
      return okAdapter(
        'adapter-disabled',
        `errorSpikeRatio=${spikeRatio.toFixed(2)} shouldRollback=${shouldRollback} (no deployment-platform vendor configured)`,
        {
          score: clamp01(spikeRatio / 5),
        },
      )
    },
  },
]
