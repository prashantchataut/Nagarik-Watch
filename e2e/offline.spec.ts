import { expect, test } from '@playwright/test'

test('homepage exposes a root-scoped service worker when available', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.locator('#main')).toBeVisible()
  await expect(page.locator('#main h1, #main h2').first()).toBeVisible()

  const supportsServiceWorkers = await page.evaluate(() => 'serviceWorker' in navigator)
  test.skip(!supportsServiceWorkers, 'Service workers are unavailable in this browser environment.')

  const workerResponse = await request.get('/sw.js')
  test.skip(!workerResponse.ok(), 'The test environment does not expose the service worker route.')
  expect(workerResponse.headers()['service-worker-allowed']).toBe('/')

  const registration = await page.evaluate(async () => {
    const registered = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    const worker = registered.active ?? registered.waiting ?? registered.installing
    return {
      scopePath: new URL(registered.scope).pathname,
      scriptPath: worker ? new URL(worker.scriptURL).pathname : null,
    }
  })

  expect(registration.scopePath).toBe('/')
  expect(registration.scriptPath).toBe('/sw.js')
})
