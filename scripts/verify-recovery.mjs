import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(process.cwd())
const failures = []
const assert = (condition, message) => {
  if (!condition) failures.push(message)
}
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

const env = read('.env')
assert((env.match(/^NEXT_PUBLIC_SITE_URL=/gm) ?? []).length === 1, 'NEXT_PUBLIC_SITE_URL must be defined exactly once in .env')

const auth = read('apps/web/lib/auth/index.ts')
assert(auth.includes('authPromise = null'), 'failed auth initialization must clear the cached promise')
assert(auth.includes('Promise.allSettled'), 'boot account provisioning must isolate per-account failures')
assert(auth.includes('could not assign'), 'boot role assignment must have explicit error handling')
assert(!auth.includes('await seedBootAccounts(auth)'), 'auth initialization must not block on boot-account seeding')

const route = 'apps/web/app/api/auth/[...all]/route.ts'
assert(fs.existsSync(path.join(root, route)), 'Better Auth catch-all route is missing')
assert(read(route).includes('toNextJsHandler'), 'Better Auth catch-all route is not wired to toNextJsHandler')

const masthead = read('apps/web/components/Masthead.tsx')
assert(masthead.includes('useEffect(() =>'), 'Masthead date must be populated after hydration')
assert(!masthead.includes('const dateLabel = formatDate(new Date()'), 'Masthead still renders a time-dependent value during hydration')

const calendar = read('apps/web/components/utilities/NepaliCalendar.tsx')
assert(calendar.includes('const [todayBs, setTodayBs]'), 'Nepali calendar must have a hydration-safe initial state')
assert(!calendar.includes('useMemo(() => adToBs(new Date()), [])'), 'Nepali calendar still computes today during initial render')

const utility = read('apps/web/components/utilities/UtilityTools.tsx')
assert(utility.includes("const [ad, setAd] = useState('')"), 'Date converter must use a stable initial value')

const inventory = JSON.parse(read('RECOVERY_INVENTORY.json'))
assert(inventory.length === 672, `expected 672 preserved ZIP entries, found ${inventory.length}`)
for (const item of inventory) {
  assert(fs.existsSync(path.join(root, item.recovered_path)), `missing recovered entry: ${item.recovered_path}`)
}

if (failures.length) {
  console.error(`Recovery verification failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Recovery verification passed')
console.log('- 672/672 uploaded ZIP entries preserved')
console.log('- auth singleton retry and seed isolation present')
console.log('- Better Auth catch-all route restored')
console.log('- duplicate site URL removed')
console.log('- known time-dependent hydration paths stabilized')
