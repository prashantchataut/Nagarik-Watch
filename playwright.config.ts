import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. Tests run against the built reader portal (`next start`) so they exercise the
 * real ISR/static output readers see, not dev-mode fast refresh. The site falls back to the
 * in-repo seed content source when no DB is present (see apps/web/lib/content), so the suite
 * needs no Postgres or Payload to run.
 *
 * `webServer` builds once and reuses the output across workers; `reuseExistingServer` lets a
 * already-running `next start` (or a local dev server on :3000) be reused to keep local
 * iteration fast.
 */
const PORT = 3100
const BASE = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Kathmandu',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'laptop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'narrow-mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 800 },
      },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `pnpm --filter @nagarikwatch/web build && pnpm --filter @nagarikwatch/web exec next start -p ${PORT}`,
    url: BASE,
    timeout: 240_000,
    // Always boot a fresh production server so E2E_TEST/AUTH_SECRET env is applied.
    reuseExistingServer: false,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: BASE,
      BETTER_AUTH_URL: BASE,
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'e2e-only-auth-secret-never-used-in-production',
      CONTENT_SOURCE: 'json',
      CI: 'true',
      E2E_TEST: 'true',
    },
  },
})
