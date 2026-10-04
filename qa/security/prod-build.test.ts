/**
 * Production-build guards — things only a real `next build` shows. Uses the build shared with the
 * S3 / S14 files (harness/prodBuild.ts).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startApp, type RunningApp } from '../harness/app'
import { cloneTemplate } from '../harness/db'
import { APP_ROOT } from '../harness/paths'
import { writeEvidence } from '../harness/evidence'
import { ensureProdBuild, prodEnv, PROD_DIST_DIR, PROD_PORT } from '../harness/prodBuild'
import { buildDoc, PASSWORD, TINY_PNG, uniq } from '../harness/seed'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('production build', () => {
  beforeAll(async () => {
    await ensureProdBuild()
  })

  it('seed/ is not compiled into the server bundle when SEED_ON_BOOT is unset (the harness never sets it)', () => {
    // Slugs of the sample content: plain ASCII literals that exist nowhere else in the codebase.
    const markers = [...readFileSync(path.join(APP_ROOT, 'seed/sampleContent.ts'), 'utf8').matchAll(/slug: '([a-z0-9-]{18,})'/g)].map((m) => m[1])
    expect(markers.length).toBeGreaterThan(3)
    const files = walk(path.join(APP_ROOT, PROD_DIST_DIR, 'server')).filter((f) => f.endsWith('.js'))
    expect(files.length).toBeGreaterThan(20)
    const hits = files.filter((f) => {
      if (/seed_index|sampleContent/.test(path.basename(f))) return true
      const src = readFileSync(f, 'utf8')
      return markers.some((m) => src.includes(m))
    })
    writeEvidence('p2-seed-not-in-bundle', { serverJsFiles: files.length, markers: markers.length, hits: hits.map((f) => path.relative(APP_ROOT, f)) })
    expect(hits).toEqual([])
  })
})

/**
 * S13 in production. qa/security/s13-security-headers.test.ts covers the policy itself on the dev
 * server; these are the parts that differ in a production build: HSTS is sent, and the policies
 * drop the development-only 'unsafe-eval' and websocket sources.
 */
describe('production server: security headers (QA S13)', () => {
  const DB = 'svo_qa_test_prod_headers'
  const ADMIN_EMAIL = 'qa-s13-admin@test.invalid'
  let app: RunningApp

  beforeAll(async () => {
    await cloneTemplate(DB)
    await ensureProdBuild()
    app = await startApp({
      name: 'prod-headers',
      port: PROD_PORT,
      command: 'start',
      env: prodEnv(DB, randomBytes(32).toString('hex'), { CREATE_ADMIN_ON_BOOT: '1', CREATE_ADMIN_EMAIL: ADMIN_EMAIL, CREATE_ADMIN_PASSWORD: PASSWORD, CREATE_ADMIN_NAME: 'QA Admin' }),
    })
  })
  afterAll(async () => {
    await app?.stop()
  })

  const headersOf = async (p: string) => {
    const res = await fetch(app.baseUrl + p, { redirect: 'manual', signal: AbortSignal.timeout(180_000) })
    await res.arrayBuffer()
    return res.headers
  }

  it.each(['/', '/de', '/ar', '/admin/login', '/api/users/init'])('REGRESSION S13: %s sends Strict-Transport-Security for at least a year', async (p) => {
    const hsts = (await headersOf(p)).get('strict-transport-security') ?? ''
    expect(hsts).toMatch(/^max-age=\d+/)
    expect(Number(hsts.match(/max-age=(\d+)/)?.[1])).toBeGreaterThanOrEqual(31_536_000)
  })

  it('REGRESSION S13: the production policies carry no unsafe-eval and no websocket sources', async () => {
    const site = (await headersOf('/de')).get('content-security-policy') ?? ''
    const admin = (await headersOf('/admin/login')).get('content-security-policy-report-only') ?? ''
    writeEvidence('s13-production-policies', { site, admin })
    for (const policy of [site, admin]) {
      expect(policy).toContain("default-src 'self'")
      expect(policy).not.toContain('unsafe-eval')
      expect(policy).not.toMatch(/\bwss?:/)
    }
    expect(site).toContain("frame-ancestors 'self'")
    expect(site).toContain("object-src 'none'")
  })

  /**
   * "A broken admin at deadline is worse": the admin panel under the production headers. Cookie
   * session and Origin header exactly as the browser sends them from the admin UI.
   */
  describe('the admin panel still works', () => {
    let cookie = ''
    let doc: { id: number | string; slug: string }
    let mediaId: number | string | undefined
    const page = async (p: string, withCookie = true) => {
      const res = await fetch(app.baseUrl + p, { redirect: 'manual', headers: withCookie ? BROWSER_SESSION() : {}, signal: AbortSignal.timeout(180_000) })
      return { status: res.status, headers: res.headers, html: await res.text() }
    }
    // Payload accepts a session cookie only with an allowed Origin or, on navigations, Sec-Fetch-Site —
    // the two headers a browser adds by itself (payload/dist/auth/extractJWT.js).
    const BROWSER_SESSION = () => ({ Cookie: cookie, 'Sec-Fetch-Site': 'same-origin' })
    const send = (method: string, p: string, body?: BodyInit, json = true) =>
      fetch(app.baseUrl + p, {
        method,
        headers: { Origin: app.baseUrl, ...(cookie ? { Cookie: cookie } : {}), ...(json && body ? { 'Content-Type': 'application/json' } : {}) },
        body,
        signal: AbortSignal.timeout(180_000),
      })

    afterAll(async () => {
      if (mediaId !== undefined) await send('DELETE', `/api/media/${mediaId}`)
    })

    it('loads: /admin/login renders, and an anonymous /admin does not show the dashboard', async () => {
      const login = await page('/admin/login', false)
      expect(login.status).toBe(200)
      expect(login.html).toMatch(/SVÖ Admin/)
      expect(login.headers.get('content-security-policy-report-only')).toContain("default-src 'self'")
      expect(login.headers.get('content-security-policy')).toBe("frame-ancestors 'self'")
      const anonymous = await page('/admin', false)
      // Never the dashboard: either a 30x to the login page or (streamed render) a 200 without it.
      expect([200, 302, 307, 308]).toContain(anonymous.status)
      if (anonymous.status !== 200) expect(anonymous.headers.get('location')).toMatch(/\/admin\/login/)
      expect(anonymous.html).not.toContain('svo-guide')
    })

    it('logs in (cookie session) and reaches the dashboard', async () => {
      const res = await send('POST', '/api/users/login', JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }))
      expect(res.status).toBe(200)
      cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
      expect(cookie).toMatch(/^payload-token=.+/)
      const dashboard = await page('/admin')
      expect(dashboard.status).toBe(200)
      // The onboarding panel above the collection cards (src/components/admin/DashboardGuide).
      expect(dashboard.html).toContain('svo-guide')
    })

    it('creates a document and opens it in the editor', async () => {
      const created = await send('POST', '/api/news', JSON.stringify(buildDoc('news', {}, 'draft')))
      expect(created.status).toBe(201)
      doc = (await created.json()).doc
      const edit = await page(`/admin/collections/news/${doc.id}`)
      expect(edit.status).toBe(200)
      expect(edit.html.includes(doc.slug) || edit.html.includes('collection-edit')).toBe(true)
    })

    it('saves the document', async () => {
      const title = uniq('QA S13 saved title')
      const res = await send('PATCH', `/api/news/${doc.id}?locale=de`, JSON.stringify({ title }))
      expect(res.status).toBe(200)
      const saved = await (await fetch(`${app.baseUrl}/api/news/${doc.id}?locale=de&depth=0`, { headers: BROWSER_SESSION(), signal: AbortSignal.timeout(180_000) })).json()
      expect(saved.title).toBe(title)
    })

    it('uploads an image and serves it back', async () => {
      const form = new FormData()
      form.append('file', new Blob([TINY_PNG], { type: 'image/png' }), `${uniq('qa-test-media-s13')}.png`)
      form.append('_payload', JSON.stringify({ alt: 'QA S13 upload' }))
      const res = await send('POST', '/api/media', form, false)
      expect(res.status).toBe(201)
      const media = (await res.json()).doc as { id: number | string; url: string; mimeType: string }
      mediaId = media.id
      expect(media.mimeType).toBe('image/png')
      const file = await fetch(new URL(media.url, app.baseUrl), { signal: AbortSignal.timeout(180_000) })
      expect(file.status).toBe(200)
      expect(file.headers.get('content-type')).toMatch(/image\/png/)
      expect(file.headers.get('x-content-type-options')).toBe('nosniff')
      expect(Buffer.from(await file.arrayBuffer()).equals(TINY_PNG)).toBe(true)
    })
  })

  it('the baseline headers are on production responses too, and X-Powered-By is not', async () => {
    for (const p of ['/de', '/admin/login', '/api/users/init']) {
      const headers = await headersOf(p)
      expect(headers.get('x-content-type-options'), p).toBe('nosniff')
      expect(headers.get('x-frame-options'), p).toBe('SAMEORIGIN')
      expect(headers.get('referrer-policy'), p).toBe('strict-origin-when-cross-origin')
      expect(headers.get('permissions-policy'), p).toContain('camera=()')
      expect(headers.get('x-powered-by'), p).toBeNull()
    }
  })
})
