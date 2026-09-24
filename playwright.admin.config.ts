import { defineConfig, devices } from '@playwright/test'

/**
 * Admin desk sweep. Shares the newsroom runner's setup -- PGlite auth, seeded
 * staff, JSON article store -- because signing in is a precondition for every
 * case here.
 *
 * Its own port and its own PGlite directory keep the two suites from writing
 * over each other's state, but they still cannot run at the same time: `next
 * dev` refuses a second instance from the same project directory whatever port
 * you give it. Run them one after the other.
 *
 * Dev server rather than `next start`: the desks are all dynamic and
 * authenticated, so a production build buys nothing here, and the dev overlay
 * surfaces hydration errors that a production build would silently swallow --
 * which is exactly what the sweep is looking for.
 */
const PORT = 3102
const BASE = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  testMatch: /admin-desk\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Kathmandu',
  },
  projects: [
    {
      name: 'admin-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `node scripts/db-reset-test.mjs && pnpm --filter @nagarikwatch/web exec next dev -p ${PORT}`,
    url: BASE,
    timeout: 360_000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      E2E_NEWSROOM: 'true',
      E2E_TEST: 'false',
      NEXT_PUBLIC_SITE_URL: BASE,
      PLAYWRIGHT_BASE_URL: BASE,
      BETTER_AUTH_URL: BASE,
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e-newsroom-auth-secret-min-32-chars-long',
      BETTER_AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e-newsroom-auth-secret-min-32-chars-long',
      PGLITE_DATA_DIR: '.data/e2e-admin-pglite',
      ALLOW_PGLITE_AUTH: 'true',
      DATABASE_URL: '',
      POSTGRES_URL: '',
      CONTENT_SOURCE: 'json',
      STAFF_MFA_ENABLED: 'false',
      AUTH_BOOT_SYNC_PASSWORD: 'true',
      NEWSROOM_REPORTER_EMAIL: 'reporter@local.test',
      NEWSROOM_REPORTER_PASSWORD: 'local-reporter-only',
      NEWSROOM_REPORTER_NAME: 'Local Reporter',
      NEWSROOM_EDITOR_EMAIL: 'editor@local.test',
      NEWSROOM_EDITOR_PASSWORD: 'local-editor-only',
      NEWSROOM_EDITOR_NAME: 'Local Editor',
      NEWSROOM_PUBLISHER_EMAIL: 'publisher@local.test',
      NEWSROOM_PUBLISHER_PASSWORD: 'local-publisher-only',
      NEWSROOM_PUBLISHER_NAME: 'Local Publisher',
      NEWSROOM_ADMIN_EMAIL: 'admin@local.test',
      NEWSROOM_ADMIN_PASSWORD: 'local-admin-only',
      NEWSROOM_ADMIN_NAME: 'Local Admin',
    },
  },
})
