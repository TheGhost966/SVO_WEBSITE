/**
 * S16 — expert `website` URL scheme; S17 — JSON-LD `</script>` break-out.
 *
 * S16 fix (src/lib/safeUrl.ts): two layers. Storage — the Experts `website` field validates
 * (http, https, mailto only), which covers REST and the public application form's Local API call;
 * the form action also rejects it up front. Render — the expert page emits the link only when
 * `safeExternalUrl` accepts the stored value, so a row written before the validation (or straight
 * into the database) still never becomes an `href`.
 *
 * S17 fix: one serializer (`serializeJsonLd`, src/lib/jsonld.ts) behind one component
 * (`<JsonLd>`), used by every JSON-LD block; it escapes `<`, `>`, `&`, U+2028 and U+2029.
 *
 * Both are tested with real stored content and the real rendered page, not just the helpers.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { queryQaDb } from '../harness/db'
import { submitPageForm } from '../harness/forms'
import { writeEvidence } from '../harness/evidence'
import { APP_ROOT } from '../harness/paths'
import { buildDoc, uniq } from '../harness/seed'
import { safeExternalUrl, validateExternalUrl } from '../../src/lib/safeUrl'
import { serializeJsonLd } from '../../src/lib/jsonld'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const admin = fx.tokens.admin
const DB = 'svo_qa_test_p0'
const ctx = { pillarId: fx.pillarId, topicId: fx.topicId }

const page = async (p: string) => {
  const res = await fetch(fx.baseUrl + p, { signal: AbortSignal.timeout(180_000) })
  return { status: res.status, html: await res.text() }
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// S16
// ─────────────────────────────────────────────────────────────────────────────

const BAD_URLS: [string, string][] = [
  ['javascript:', 'javascript:alert(document.domain)'],
  ['mixed-case javascript:', 'JaVaScRiPt:alert(1)'],
  ['javascript: split by a tab', 'java\tscript:alert(1)'],
  ['data:', 'data:text/html,<script>alert(1)</script>'],
  ['vbscript:', 'vbscript:msgbox(1)'],
  ['file:', 'file:///etc/passwd'],
  ['ftp:', 'ftp://example.org/file'],
  ['scheme-relative', '//evil.example/path'],
  ['no scheme', 'evil.example'],
  ['relative path', '/qa-s16-relative'],
  ['https: without a host', 'https://'],
  ['mailto: without an address', 'mailto:nobody'],
]
const GOOD_URLS: [string, string, string][] = [
  ['https', 'https://example.org', 'https://example.org/'],
  ['http with path and query', 'http://example.org/a/b?x=1', 'http://example.org/a/b?x=1'],
  ['upper-case scheme and host', 'HTTPS://EXAMPLE.ORG/Path', 'https://example.org/Path'],
  ['mailto', 'mailto:person@example.org', 'mailto:person@example.org'],
]

const expertDoc = (website: string | undefined, status: 'draft' | 'published' = 'draft') => {
  // Own contact details: the seeded ones are what the S1 suite counts and searches for.
  const doc: Record<string, unknown> = { ...buildDoc('experts', ctx, status), contactEmail: `${uniq('qa-s16')}@test.invalid`, contactPhone: '+43 1 000 0160' }
  if (website !== undefined) doc.website = website
  return doc
}
const websiteInDb = async (id: number | string) => (await queryQaDb(DB, 'SELECT website FROM experts WHERE id = $1', [id])).rows[0]?.website as string | null | undefined

describe('S16 — helper: safeExternalUrl / validateExternalUrl', () => {
  it.each(BAD_URLS)('rejects %s', (_label, url) => {
    expect(safeExternalUrl(url)).toBeNull()
    expect(validateExternalUrl(url)).toMatch(/http:\/\/, https:\/\/ or mailto:/)
  })
  it.each(GOOD_URLS)('accepts %s', (_label, url, normalised) => {
    expect(safeExternalUrl(url)).toBe(normalised)
    expect(validateExternalUrl(url)).toBe(true)
  })
  it('empty values are valid (the field is optional) and non-strings are never links', () => {
    for (const empty of ['', null, undefined]) expect(validateExternalUrl(empty)).toBe(true)
    for (const v of [null, undefined, 42, {}, ['https://example.org']]) expect(safeExternalUrl(v)).toBeNull()
  })
})

describe('S16 — layer 1, storage: the Experts `website` field (REST)', () => {
  it.each(BAD_URLS)('REGRESSION S16: creating an expert with a %s website → 400, nothing stored', async (_label, url) => {
    const doc = expertDoc(url)
    const res = await api.post('/api/experts', doc, admin)
    expect(res.status).toBe(400)
    expect(JSON.stringify(res.body)).toMatch(/website/i)
    const rows = await queryQaDb(DB, 'SELECT id FROM experts WHERE slug = $1', [doc.slug])
    expect(rows.rowCount).toBe(0)
  })

  it('REGRESSION S16: an existing expert cannot be updated to an unsafe website either (admin, board and editor)', async () => {
    const created = await api.post('/api/experts', expertDoc('https://example.org'), admin)
    expect(created.status).toBe(201)
    const id = created.body.doc.id
    const statuses: Record<string, number> = {}
    for (const role of ['admin', 'board', 'editor'] as const) {
      const res = await api.patch(`/api/experts/${id}`, { website: 'javascript:alert(1)' }, fx.tokens[role])
      statuses[role] = res.status
      expect(res.status, role).toBe(400)
    }
    writeEvidence('s16-update-unsafe-website', statuses)
    expect(await websiteInDb(id)).toBe('https://example.org')
  })

  it.each(GOOD_URLS)('a %s website is stored', async (_label, url) => {
    const res = await api.post('/api/experts', expertDoc(url), admin)
    expect(res.status).toBe(201)
    expect(await websiteInDb(res.body.doc.id)).toBe(url)
  })

  it('an expert without a website can still be created and edited', async () => {
    const res = await api.post('/api/experts', expertDoc(undefined), admin)
    expect(res.status).toBe(201)
    expect((await api.patch(`/api/experts/${res.body.doc.id}`, { city: 'Wien' }, admin)).status).toBe(200)
  })
})

describe('S16 — layer 1, storage: the public application form (/de/experten/eintragen)', () => {
  const apply = (name: string, website: string, ip: string) =>
    submitPageForm(
      `${fx.baseUrl}/de/experten/eintragen`,
      'name="contactEmail"',
      { name, contactEmail: 'qa-applicant@test.invalid', website, consent: 'on', company: '' },
      { ip },
    )
  const rowsFor = async (name: string) => (await queryQaDb(DB, 'SELECT website, review_status FROM experts WHERE name = $1', [name])).rows

  it.each([
    ['javascript:', 'javascript:alert(document.domain)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['ftp:', 'ftp://example.org/file'],
  ])('REGRESSION S16: an application with a %s website is refused and nothing is stored', async (_label, website) => {
    const name = uniq('QA S16 applicant bad')
    const res = await apply(name, website, '198.51.100.61')
    expect(res.status).toBe(200)
    // In the form's alert box — the bare string is on every page (client message bundle).
    expect(res.html).toMatch(/role="alert"[^>]*>[^<]*Bitte geben Sie eine gültige Webadresse an/)
    expect(await rowsFor(name)).toEqual([])
  })

  it('a normal application still works; `www.example.org` is stored as an https URL', async () => {
    const name = uniq('QA S16 applicant ok')
    const res = await apply(name, 'www.example.org', '198.51.100.62')
    expect(res.status).toBe(200)
    expect(await rowsFor(name)).toEqual([{ website: 'https://www.example.org/', review_status: 'in_review' }])
  })
})

describe('S16 — layer 2, render: /de/experten/<slug> with content already in the database', () => {
  /**
   * The row is created through the API with a valid URL, then the column is overwritten directly —
   * the state a pre-fix submission (or any direct write) leaves behind. The page for a brand-new
   * slug has never been rendered, so nothing is cached and it reads this row.
   */
  const storedExpert = async (website: string) => {
    const created = await api.post('/api/experts', expertDoc('https://placeholder.example', 'published'), admin)
    expect(created.status).toBe(201)
    const { id, slug } = created.body.doc
    const updated = await queryQaDb(DB, 'UPDATE experts SET website = $1 WHERE id = $2', [website, id])
    expect(updated.rowCount).toBe(1)
    return slug as string
  }
  const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'))

  it.each(BAD_URLS)('REGRESSION S16: a stored %s website is not rendered as a link', async (_label, url) => {
    const slug = await storedExpert(url)
    const { status, html } = await page(`/de/experten/${slug}`)
    expect(status).toBe(200)
    const all = hrefs(html)
    expect(all.length).toBeGreaterThan(5)
    expect(all.filter((h) => /^\s*(javascript|data|vbscript|file|ftp):/i.test(h))).toEqual([])
    expect(all).not.toContain(url)
    // No external link at all on this profile: nothing in the header/footer points off-site.
    expect(all.filter((h) => /evil\.example|example\.org|^\/\//.test(h))).toEqual([])
  })

  it.each(GOOD_URLS)('a stored %s website is rendered as a link to the normalised URL', async (_label, url, normalised) => {
    const slug = await storedExpert(url)
    const { status, html } = await page(`/de/experten/${slug}`)
    expect(status).toBe(200)
    expect(hrefs(html)).toContain(normalised)
    expect(html).toMatch(/rel="noopener noreferrer nofollow"/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// S17
// ─────────────────────────────────────────────────────────────────────────────

const BREAKOUT = '</script><script>alert(1)</script>'
/** Every character the serializer must neutralise, in one title. */
const evilTitle = (tag: string) => `QA S17 ${tag} ${BREAKOUT} <!-- & <b> \u2028 \u2029 end`

const ldBlocks = (html: string) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])

describe('S17 — helper: serializeJsonLd', () => {
  it('escapes <, >, &, U+2028 and U+2029 and still parses back to the same value', () => {
    const data = { name: evilTitle('unit'), nested: [{ text: 'a < b && c > d' }] }
    const out = serializeJsonLd(data)
    expect(out).not.toMatch(/[<>&\u2028\u2029]/)
    expect(out).toContain('\\u003c/script\\u003e')
    expect(JSON.parse(out)).toEqual(data)
  })
})

describe('S17 — static: one serializer behind every JSON-LD block', () => {
  const files = walk(path.join(APP_ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f))
  const rel = (f: string) => path.relative(APP_ROOT, f).replace(/\\/g, '/')

  it('REGRESSION S17: the only <script type="application/ld+json"> in src/ is the shared JsonLd component', () => {
    const emitters = files.filter((f) => /<script[^>]*application\/ld\+json/.test(readFileSync(f, 'utf8'))).map(rel)
    expect(emitters).toEqual(['src/components/ui/JsonLd.tsx'])
    expect(readFileSync(path.join(APP_ROOT, 'src/components/ui/JsonLd.tsx'), 'utf8')).toContain('__html: serializeJsonLd(data)')
  })

  it('REGRESSION S17: no file feeds JSON.stringify into dangerouslySetInnerHTML', () => {
    const offenders = files.filter((f) => /dangerouslySetInnerHTML=\{\{\s*__html:\s*JSON\.stringify/.test(readFileSync(f, 'utf8'))).map(rel)
    expect(offenders).toEqual([])
  })

  it('every page that builds a schema.org object renders it through <JsonLd>', () => {
    const builders = files.filter((f) => f.endsWith('page.tsx') && /Schema\(/.test(readFileSync(f, 'utf8')))
    expect(builders.length).toBeGreaterThanOrEqual(8)
    for (const f of builders) expect(readFileSync(f, 'utf8'), rel(f)).toMatch(/<JsonLd\s/)
  })
})

describe('S17 — rendered pages with a `</script>` payload stored in real documents', () => {
  const create = async (collection: string, body: Record<string, unknown>) => {
    const res = await api.post(`/api/${collection}`, body, admin)
    if (res.status !== 201) throw new Error(`create ${collection} → ${res.status} ${res.text.slice(0, 400)}`)
    return res.body.doc as { id: number | string; slug: string }
  }

  /** [label, path of the public page, title stored in the document(s) it renders, JSON-LD blocks expected] */
  const cases: [string, () => Promise<{ url: string; titles: string[]; blocks: number }>][] = [
    [
      'news article',
      async () => {
        const title = evilTitle('news')
        const doc = await create('news', { ...buildDoc('news', ctx, 'published'), title })
        return { url: `/de/nachrichten/${doc.slug}`, titles: [title], blocks: 2 }
      },
    ],
    [
      'event',
      async () => {
        const title = evilTitle('event')
        const doc = await create('events', { ...buildDoc('events', ctx, 'published'), title })
        return { url: `/de/veranstaltungen/${doc.slug}`, titles: [title], blocks: 2 }
      },
    ],
    [
      'roadmap',
      async () => {
        const title = evilTitle('roadmap')
        const doc = await create('roadmaps', { ...buildDoc('roadmaps', ctx, 'published'), title })
        return { url: `/de/anleitungen/${doc.slug}`, titles: [title], blocks: 2 }
      },
    ],
    [
      'job posting',
      async () => {
        const title = evilTitle('job')
        const doc = await create('jobs', { ...buildDoc('jobs', ctx, 'published'), title, organisation: evilTitle('org') })
        return { url: `/de/stellenangebote/${doc.slug}`, titles: [title], blocks: 1 }
      },
    ],
    [
      'guide topic (breadcrumb) and guide article',
      async () => {
        const topicTitle = evilTitle('topic')
        const title = evilTitle('article')
        const topic = await create('guide-topics', { title: topicTitle, slug: uniq('qa-s17-topic'), order: 90 })
        const doc = await create('guide-articles', { ...buildDoc('guide-articles', { ...ctx, topicId: topic.id }, 'published'), title })
        return { url: `/de/oesterreich-guide/${topic.slug}/${doc.slug}`, titles: [title, topicTitle], blocks: 2 }
      },
    ],
    [
      'guide topic page',
      async () => {
        const topicTitle = evilTitle('topicpage')
        const topic = await create('guide-topics', { title: topicTitle, slug: uniq('qa-s17-topicpage'), order: 91 })
        await create('guide-articles', buildDoc('guide-articles', { ...ctx, topicId: topic.id }, 'published'))
        return { url: `/de/oesterreich-guide/${topic.slug}`, titles: [topicTitle], blocks: 1 }
      },
    ],
    [
      'service pillar (breadcrumb) and service',
      async () => {
        const pillarTitle = evilTitle('pillar')
        const title = evilTitle('service')
        const pillar = await create('service-pillars', { title: pillarTitle, slug: uniq('qa-s17-pillar'), order: 90 })
        const doc = await create('services', { ...buildDoc('services', { ...ctx, pillarId: pillar.id }, 'published'), title })
        return { url: `/de/leistungen/${pillar.slug}/${doc.slug}`, titles: [title, pillarTitle], blocks: 2 }
      },
    ],
    [
      'service pillar page',
      async () => {
        const pillarTitle = evilTitle('pillarpage')
        const pillar = await create('service-pillars', { title: pillarTitle, slug: uniq('qa-s17-pillarpage'), order: 91 })
        return { url: `/de/leistungen/${pillar.slug}`, titles: [pillarTitle], blocks: 1 }
      },
    ],
  ]

  it.each(cases)('REGRESSION S17: %s — the payload stays inside the JSON-LD data and the block still parses', async (label, setup) => {
    const { url, titles, blocks } = await setup()
    const { status, html } = await page(url)
    expect(status).toBe(200)

    // 1. Nowhere in the document does the stored text terminate a script element.
    expect(html).not.toContain(BREAKOUT)
    expect(html).not.toContain('<script>alert(1)')

    // 2. Exactly the expected JSON-LD blocks, none of them cut short by the payload.
    const found = ldBlocks(html)
    writeEvidence(`s17-${label.replace(/\W+/g, '-')}`, { url, status, blocks: found.length, firstBlock: found[0]?.slice(0, 400) })
    expect(found).toHaveLength(blocks)

    // 3. Each block is free of the raw characters and is valid JSON…
    const parsed = found.map((block) => {
      expect(block).not.toMatch(/[<>&\u2028\u2029]/)
      return JSON.stringify(JSON.parse(block))
    })
    // 4. …that still carries the stored title, character for character.
    for (const title of titles) {
      const needle = JSON.stringify(title).slice(1, -1)
      expect(parsed.some((p) => p.includes(needle)), `title "${title.slice(0, 24)}…" in JSON-LD of ${url}`).toBe(true)
    }
  })
})
