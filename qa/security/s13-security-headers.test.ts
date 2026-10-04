/**
 * S13 — security headers.
 *
 * Fix (next.config.ts): on every response X-Content-Type-Options, Referrer-Policy, X-Frame-Options,
 * Permissions-Policy and (production only — see prod-build.test.ts) Strict-Transport-Security.
 * The public site gets an enforced Content-Security-Policy. /admin gets the full policy as
 * Content-Security-Policy-Report-Only plus an enforced `frame-ancestors 'self'`; /api and /media
 * get the enforced `frame-ancestors 'self'` only.
 *
 * That the admin panel still loads, logs in, saves a document and uploads an image under these
 * headers is checked against the production build in prod-build.test.ts.
 */
import { describe, expect, inject, it } from 'vitest'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')

const get = async (p: string, headers: Record<string, string> = {}) => {
  const res = await fetch(fx.baseUrl + p, { redirect: 'manual', headers, signal: AbortSignal.timeout(280_000) })
  return { status: res.status, headers: res.headers, html: await res.text() }
}

/** "a 'self' x; b y" → { a: ["'self'", 'x'], b: ['y'] } */
const directives = (policy: string | null): Record<string, string[]> =>
  Object.fromEntries(
    (policy ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...values] = d.split(/\s+/)
        return [name, values]
      }),
  )

const PUBLIC_PATHS = ['/de', '/ar', '/en', '/de/kontakt', '/de/nachrichten', '/de/experten', '/de/oesterreich-guide', '/de/search?q=test', '/de/this-page-does-not-exist']
// One admin URL is enough here (it makes the dev server compile the whole admin UI); the production
// suite (prod-build.test.ts) covers more of them plus login, save and upload.
const ADMIN_PATHS = ['/admin/login']
const API_PATHS = ['/api/users/init', '/api/globals/site-settings', '/api/news?limit=1']

describe('S13 — baseline headers on every kind of response', () => {
  it.each(['/', ...PUBLIC_PATHS, ...ADMIN_PATHS, ...API_PATHS])('REGRESSION S13: %s', { timeout: 400_000 }, async (p) => {
    const { headers } = await get(p)
    expect(headers.get('x-content-type-options')).toBe('nosniff')
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('x-frame-options')).toBe('SAMEORIGIN')
    const permissions = headers.get('permissions-policy') ?? ''
    for (const feature of ['camera=()', 'microphone=()', 'geolocation=()', 'payment=()']) expect(permissions).toContain(feature)
    expect(headers.get('x-powered-by')).toBeNull()
    // Every response forbids framing by other origins, whichever policy it otherwise carries.
    expect(directives(headers.get('content-security-policy'))['frame-ancestors']).toEqual(["'self'"])
  })
})

describe('S13 — public site: an enforced Content-Security-Policy', () => {
  it.each(['/', ...PUBLIC_PATHS])('REGRESSION S13: %s sends the enforced policy, not a report-only one', async (p) => {
    const { headers } = await get(p)
    expect(headers.get('content-security-policy-report-only')).toBeNull()
    const d = directives(headers.get('content-security-policy'))
    expect(d['default-src']).toEqual(["'self'"])
    expect(d['object-src']).toEqual(["'none'"])
    expect(d['frame-src']).toEqual(["'none'"])
    expect(d['base-uri']).toEqual(["'self'"])
    expect(d['form-action']).toEqual(["'self'"])
    expect(d['font-src']).toEqual(["'self'"])
    expect(d['script-src']).toContain("'self'")
    // No directive opens up to arbitrary origins.
    for (const [name, values] of Object.entries(d)) {
      for (const v of values) expect(['*', 'http:', 'https:'], `${name} ${v}`).not.toContain(v)
    }
    // Scripts may only come from this origin: no remote host, no data:/blob: script sources.
    expect(d['script-src'].filter((v) => !["'self'", "'unsafe-inline'", "'unsafe-eval'"].includes(v))).toEqual([])
  })

  it('the policy matches what the pages actually load: every script, stylesheet, font and image on /de, /ar and /de/kontakt is same-origin', async () => {
    const offenders: string[] = []
    for (const p of ['/de', '/ar', '/de/kontakt']) {
      const { status, html } = await get(p)
      expect(status).toBe(200)
      // Every URL a <script>, <link>, <img> or <iframe> tag points at (canonical/hreflang links are
      // absolute URLs on this origin, so they pass the same check).
      const urls = [...html.matchAll(/<(script|link|img|iframe)\b[^>]*>/g)]
        .map((m) => m[0].match(/\b(?:src|href)="([^"]+)"/)?.[1])
        .filter((u): u is string => Boolean(u))
        .map((u) => u.replace(/&amp;/g, '&'))
      expect(urls.length).toBeGreaterThan(3)
      for (const u of urls) {
        const sameOrigin = (u.startsWith('/') && !u.startsWith('//')) || u.startsWith(fx.baseUrl) || u.startsWith('data:')
        if (!sameOrigin) offenders.push(`${p}: ${u}`)
      }
    }
    writeEvidence('s13-public-asset-origins', { offenders })
    expect(offenders).toEqual([])
  })
})

describe('S13 — /admin: full policy as Report-Only, only frame-ancestors enforced', () => {
  it.each(ADMIN_PATHS)('REGRESSION S13: %s', { timeout: 400_000 }, async (p) => {
    const { headers } = await get(p)
    const reportOnly = directives(headers.get('content-security-policy-report-only'))
    expect(reportOnly['default-src']).toEqual(["'self'"])
    expect(reportOnly['object-src']).toEqual(["'none'"])
    expect(reportOnly['script-src']).toContain("'self'")
    // A broken admin at deadline is worse: nothing but framing is *enforced* here.
    expect(Object.keys(directives(headers.get('content-security-policy')))).toEqual(['frame-ancestors'])
  })
})

describe('S13 — /api: frame-ancestors only, no page policy', () => {
  it.each(API_PATHS)('%s', async (p) => {
    const { headers } = await get(p)
    expect(Object.keys(directives(headers.get('content-security-policy')))).toEqual(['frame-ancestors'])
    expect(headers.get('content-security-policy-report-only')).toBeNull()
  })
})
