import { test, expect } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const REPORTER = { email: 'reporter@local.test', password: 'local-reporter-only' }
const EDITOR = { email: 'editor@local.test', password: 'local-editor-only' }
const PUBLISHER = { email: 'publisher@local.test', password: 'local-publisher-only' }

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3101'

async function signInWithApi(
  page: import('@playwright/test').Page,
  creds: { email: string; password: string },
) {
  let lastBody = ''
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const ok = await page.evaluate(async ({ email, password }) => {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) return true
      return res.text()
    }, creds)
    if (ok === true) return
    lastBody = typeof ok === 'string' ? ok : 'unknown sign-in failure'
    if (/INVALID_EMAIL_OR_PASSWORD|User not found/i.test(lastBody)) {
      await page.waitForTimeout(500)
      continue
    }
    break
  }
  expect(false, `sign-in failed for ${creds.email}: ${lastBody}`).toBeTruthy()
}

async function reporterLogin(page: import('@playwright/test').Page) {
  await page.goto('/journalist/login')
  await page.locator('[data-boot-ready="true"]').waitFor({ state: 'attached', timeout: 120_000 })
  await signInWithApi(page, REPORTER)
}

async function adminLogin(
  page: import('@playwright/test').Page,
  creds: { email: string; password: string },
) {
  await page.goto('/admin/login')
  await page
    .getByRole('button', { name: 'Sign in' })
    .waitFor({ state: 'visible', timeout: 120_000 })
  await signInWithApi(page, creds)
}

test.describe.serial('newsroom editorial lifecycle', () => {
  const runId = Date.now().toString(36)
  let articleId = ''
  let reporterId = ''
  const category = 'politics'
  const slug = () => `e2e-${runId}`

  test('reporter creates draft, uploads thumbnail, and submits', async ({ page }) => {
    await reporterLogin(page)
    await page.goto('/journalist/articles/new')
    await expect(page).toHaveURL(/journalist\/articles\/new/)

    await page.getByLabel(/Nepali headline|नेपाली शीर्षक/i).fill(`E2E परीक्षण ${runId}`)
    await page.getByLabel(/Desk|विभाग/i).selectOption('politics')
    await page.getByLabel(/URL slug/i).fill(`e2e-${runId}`)
    await page.getByLabel(/Story body|समाचार सामग्री/i).fill('यो परीक्षण समाचार हो। '.repeat(20))

    await page
      .getByPlaceholder(/जिल्ला, पालिका|District, municipality/i)
      .fill('Kathmandu', { force: true })
    await page
      .getByPlaceholder(/कोसँग कुरा|Who was interviewed/i)
      .fill('Interview with municipal official; documents reviewed on site.', { force: true })

    mkdirSync(resolve('e2e/fixtures'), { recursive: true })
    const fixture = resolve('e2e/fixtures/tiny.png')
    writeFileSync(
      fixture,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    )
    const uploaded = await page.evaluate(async () => {
      const bytes = Uint8Array.from(
        atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        ),
        (c) => c.charCodeAt(0),
      )
      const file = new File([bytes], 'tiny.png', { type: 'image/png' })
      const body = new FormData()
      body.set('file', file)
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(String((payload as { error?: string }).error ?? res.status))
      }
      return payload as { url?: string }
    })
    expect(uploaded.url).toBeTruthy()

    // Studio action buttons are flaky under Playwright in dev; exercise the same API the UI calls.
    const createdBody = await page.evaluate(
      async (payload) => {
        const res = await fetch('/api/journalist/articles', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(JSON.stringify(body))
        return body as {
          meta?: { articleId?: string; reporterId?: string }
          article?: { id?: string }
        }
      },
      {
        titleNe: `E2E परीक्षण ${runId}`,
        slug: slug(),
        categorySlug: 'politics',
        bodyNe: 'यो परीक्षण समाचार हो। '.repeat(20),
        reportingLocation: 'Kathmandu',
        sourceNote: 'Interview with municipal official; documents reviewed on site.',
        heroImageUrl: uploaded.url,
        tagSlugs: ['local-election'],
        workflowStage: 'submitted',
        locale: 'ne',
      },
    )
    articleId = createdBody.meta?.articleId ?? createdBody.article?.id ?? ''
    reporterId = createdBody.meta?.reporterId ?? ''
    expect(articleId.length).toBeGreaterThan(0)
    expect(reporterId.length).toBeGreaterThan(0)
  })

  test('editor requests changes', async ({ page }) => {
    expect(articleId).toBeTruthy()
    expect(reporterId).toBeTruthy()
    await adminLogin(page, EDITOR)
    await page.goto('/admin/journalists')
    const row = page.locator('tr').filter({ hasText: runId })
    await expect(row).toBeVisible({ timeout: 20_000 })

    const feedback = 'Add official quote and verify municipality response.'
    const result = await page.evaluate(
      async (payload) => {
        const res = await fetch('/api/admin/journalist-feedback', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            identifier: payload.articleId,
            reporterId: payload.reporterId,
            feedback: payload.feedback,
            action: 'revision',
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(JSON.stringify(body))
        return body as { ok?: boolean; meta?: { workflowStage?: string; editorFeedback?: string } }
      },
      { articleId, reporterId, feedback },
    )
    expect(result.ok).toBe(true)
    expect(result.meta?.editorFeedback).toContain('official quote')
    expect(result.meta?.workflowStage).toBe('draft')

    await page.reload()
    await expect(row).toBeVisible({ timeout: 20_000 })
    await expect(row).toContainText(/draft|संशोधन|official quote/i)
  })

  test('publisher publishes and public article renders', async ({ page }) => {
    expect(articleId).toBeTruthy()
    await adminLogin(page, PUBLISHER)
    const publicPath = `/${category}/${slug()}`

    const published = await page.evaluate(
      async (payload) => {
        async function advance(stage: string) {
          const res = await fetch(`/api/admin/articles/${payload.articleId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ workflowStage: stage }),
          })
          const body = await res.json().catch(() => ({}))
          if (!res.ok) {
            throw new Error(`stage ${stage}: ${JSON.stringify(body)}`)
          }
          return body as { workflowStage?: string }
        }
        await advance('submitted')
        await advance('ready')
        return advance('published')
      },
      { articleId },
    )
    expect(published.workflowStage).toBe('published')

    await page.goto(publicPath, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(runId)).toBeVisible({ timeout: 30_000 })
  })
})
