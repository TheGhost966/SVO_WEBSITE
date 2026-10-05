/**
 * S1 — Experts' private contact data must not be exposed through the public REST API.
 *
 * Fix (src/collections/Experts.ts): field-level `read` access —
 *   contactEmail / contactPhone → editor/board/admin, or anyone when showEmail / showPhone is true
 *   consentOnFile / consentDate / verificationStatus / verifiedAt → editor/board/admin only
 * Field read access also makes Payload refuse `where` on those paths for callers who can't read them.
 *
 * History: this file previously held "REPRODUCES S1" characterization tests proving the leak.
 * Each one is replaced here by the inverse assertion on the same probe; the
 * controls are unchanged.
 *
 * Seed (harness/seed.ts): one expert per review status, all with showEmail=false, showPhone=false
 * and distinct private contactEmail/contactPhone values (EXPERT_PRIVATE).
 */
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { Api, qs } from '../harness/api'
import { EXPERT_PRIVATE, buildDoc } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const publishedId = fx.docs.experts.published
const PUB = EXPERT_PRIVATE.published

const PRIVATE_FIELDS = ['contactEmail', 'contactPhone', 'consentDate', 'consentOnFile', 'verificationStatus', 'verifiedAt']
const ALWAYS_PRIVATE = ['consentDate', 'consentOnFile', 'verificationStatus', 'verifiedAt']

function expectNoPrivateData(doc: Record<string, unknown>, rawText: string, label: string) {
  for (const f of PRIVATE_FIELDS) expect(doc, `${label}: ${f}`).not.toHaveProperty(f)
  expect(rawText, `${label}: raw body contains private email`).not.toContain(PUB.contactEmail)
  expect(rawText, `${label}: raw body contains private phone`).not.toContain(PUB.contactPhone)
}

/** Published experts with show flags on, created for this file. */
const shown = {
  email: { email: `qa-shown-email-${Date.now()}@test.invalid`, phone: '+43 1 000 1111', id: 0 as string | number, slug: '' },
  phone: { email: `qa-shown-phone-${Date.now()}@test.invalid`, phone: '+43 1 000 2222', id: 0 as string | number, slug: '' },
}

beforeAll(async () => {
  for (const [key, flags] of [
    ['email', { showEmail: true, showPhone: false }],
    ['phone', { showEmail: false, showPhone: true }],
  ] as const) {
    const res = await api.post(
      '/api/experts',
      { ...buildDoc('experts', {}, 'published'), contactEmail: shown[key].email, contactPhone: shown[key].phone, ...flags },
      fx.tokens.admin,
    )
    expect(res.status, res.text.slice(0, 300)).toBe(201)
    shown[key].id = res.body.doc.id
    shown[key].slug = res.body.doc.slug
  }
})

describe('S1 — anonymous REST access to experts', () => {
  it('REGRESSION S1: list response does NOT contain contactEmail, contactPhone, consentDate, verificationStatus (show flags off)', async () => {
    const res = await api.get('/api/experts?depth=0&limit=100')
    expect(res.status).toBe(200)
    const doc = res.body.docs.find((d: { id: unknown }) => d.id === publishedId)
    writeEvidence('s1-experts-list-anonymous', { status: res.status, exposedFieldNames: Object.keys(doc ?? {}).sort(), publishedExpert: doc })
    expect(doc, 'published expert must still be listed').toBeDefined()
    expect(doc.name).toEqual(expect.any(String))
    expectNoPrivateData(doc, res.text, 'list')
  })

  it('REGRESSION S1: GET /api/experts/:id does NOT contain the private fields', async () => {
    const res = await api.get(`/api/experts/${publishedId}?depth=0`)
    writeEvidence('s1-experts-by-id-anonymous', { status: res.status, body: res.body })
    expect(res.status).toBe(200)
    expectNoPrivateData(res.body, res.text, 'by id')
  })

  it('REGRESSION S1: where/count on contactEmail / contactPhone is refused — no search oracle on hidden fields', async () => {
    const probes = {
      like_full: qs({ where: { contactEmail: { like: PUB.contactEmail } } }),
      like_partial: qs({ where: { contactEmail: { like: 'private-published' } } }),
      equals: qs({ where: { contactEmail: { equals: PUB.contactEmail } } }),
      phone_like: qs({ where: { contactPhone: { like: '000 0001' } } }),
      domain_like: qs({ where: { contactEmail: { like: '@test.invalid' } } }),
      consent_exists: qs({ where: { consentDate: { exists: true } } }),
      verification_equals: qs({ where: { verificationStatus: { equals: 'unverified' } } }),
    }
    const results: Record<string, { status: number; text: string }> = {}
    for (const [name, query] of Object.entries(probes)) {
      const res = await api.get(`/api/experts?depth=0&${query}`)
      results[name] = { status: res.status, text: res.text.slice(0, 300) }
    }
    const count = await api.get(`/api/experts/count?${probes.like_partial}`)
    writeEvidence('s1-experts-where-oracle-anonymous', { probes: results, count: { status: count.status, body: count.text.slice(0, 300) } })
    for (const [name, r] of Object.entries(results)) {
      expect(r.status, `${name}: ${r.text}`).toBeGreaterThanOrEqual(400)
      expect(r.status, name).toBeLessThan(500)
      expect(r.text, name).not.toContain(PUB.contactEmail)
    }
    expect(count.status).toBeGreaterThanOrEqual(400)
    expect(count.status).toBeLessThan(500)
  })

  it('REGRESSION S1: ?select[contactEmail]=true does not return the private field', async () => {
    const res = await api.get(`/api/experts?depth=0&${qs({ select: { contactEmail: true } })}`)
    writeEvidence('s1-experts-select-anonymous', { status: res.status, body: res.text.slice(0, 1000) })
    expect(res.status).toBe(200)
    expect(res.text).not.toContain(PUB.contactEmail)
    for (const d of res.body.docs) {
      if (d.id === publishedId) expect(d).not.toHaveProperty('contactEmail')
    }
  })

  it('REGRESSION S1: experts populated through a relationship (guide-articles.relatedExperts, depth=1) are filtered the same way', async () => {
    const article = await api.post(
      '/api/guide-articles',
      { ...buildDoc('guide-articles', { topicId: fx.topicId }, 'published'), relatedExperts: [publishedId] },
      fx.tokens.admin,
    )
    expect(article.status, article.text.slice(0, 300)).toBe(201)
    const res = await api.get(`/api/guide-articles/${article.body.doc.id}?depth=1`)
    expect(res.status).toBe(200)
    const populated = res.body.relatedExperts.find((e: { id: unknown }) => e.id === publishedId)
    expect(populated, 'expert must be populated').toBeDefined()
    expectNoPrivateData(populated, res.text, 'populated relation')
  })

  it('showEmail=true exposes ONLY the email; showPhone=true exposes ONLY the phone; consent/verification stay hidden', async () => {
    const e = await api.get(`/api/experts/${shown.email.id}?depth=0`)
    const p = await api.get(`/api/experts/${shown.phone.id}?depth=0`)
    writeEvidence('s1-experts-show-flags-anonymous', { showEmail: e.body, showPhone: p.body })
    expect(e.body.contactEmail).toBe(shown.email.email)
    expect(e.body).not.toHaveProperty('contactPhone')
    expect(p.body.contactPhone).toBe(shown.phone.phone)
    expect(p.body).not.toHaveProperty('contactEmail')
    for (const f of ALWAYS_PRIVATE) {
      expect(e.body, f).not.toHaveProperty(f)
      expect(p.body, f).not.toHaveProperty(f)
    }
  })

  it('control: private data of draft / in_review / archived experts is NOT reachable anonymously (list, by id, ?draft=true)', async () => {
    const hidden = (['draft', 'in_review', 'archived'] as const).map((s) => ({ status: s, id: fx.docs.experts[s], ...EXPERT_PRIVATE[s] }))
    const list = await api.get('/api/experts?depth=0&limit=100')
    const draftList = await api.get('/api/experts?depth=0&limit=100&draft=true')
    const byId: Record<string, number> = {}
    for (const h of hidden) {
      byId[h.status] = (await api.get(`/api/experts/${h.id}?depth=0`)).status
      byId[`${h.status}+draft`] = (await api.get(`/api/experts/${h.id}?depth=0&draft=true`)).status
    }
    writeEvidence('s1-experts-unpublished-control', { byId, draftListStatus: draftList.status })
    for (const h of hidden) {
      expect(list.text).not.toContain(h.contactEmail)
      expect(draftList.text).not.toContain(h.contactEmail)
    }
    for (const [k, status] of Object.entries(byId)) expect(status, k).toBe(404)
  })
})

describe('S1 — authenticated roles', () => {
  it.each(['editor', 'board', 'admin'] as const)('%s still reads every private field (admin panel workflow)', async (role) => {
    const res = await api.get(`/api/experts/${publishedId}?depth=0`, fx.tokens[role])
    expect(res.status).toBe(200)
    expect(res.body.contactEmail).toBe(PUB.contactEmail)
    expect(res.body.contactPhone).toBe(PUB.contactPhone)
    expect(res.body.consentDate).toEqual(expect.any(String))
    expect(res.body.consentOnFile).toBe(true)
    expect(res.body.verificationStatus).toBe('unverified')
  })

  it('editor can still filter by contactEmail (inbox / de-duplication workflow)', async () => {
    const res = await api.get(`/api/experts?depth=0&${qs({ where: { contactEmail: { equals: PUB.contactEmail } } })}`, fx.tokens.editor)
    expect(res.status).toBe(200)
    expect(res.body.totalDocs).toBe(1)
  })

  it('viewer (read-only role) gets the same field filtering as anonymous', async () => {
    const res = await api.get(`/api/experts/${publishedId}?depth=0`, fx.tokens.viewer)
    expect(res.status).toBe(200)
    expectNoPrivateData(res.body, res.text, 'viewer')
  })

  it('board can still verify an expert (field update access unchanged)', async () => {
    const created = await api.post('/api/experts', buildDoc('experts', {}, 'draft'), fx.tokens.admin)
    const res = await api.patch(`/api/experts/${created.body.doc.id}`, { verificationStatus: 'verified' }, fx.tokens.board)
    expect(res.status, res.text.slice(0, 200)).toBe(200)
    expect(res.body.doc.verificationStatus).toBe('verified')
  })
})

describe('S1 — public website (Local API rendering is unchanged)', () => {
  const page = async (slug: string) => {
    const res = await fetch(`${fx.baseUrl}/de/experten/${slug}`, { signal: AbortSignal.timeout(180_000) })
    return { status: res.status, html: await res.text() }
  }

  it('show flags off: the expert page renders but shows neither email nor phone', async () => {
    const { status, html } = await page(fx.slugs.experts.published)
    writeEvidence('s1-expert-page-html-check', { status, containsEmail: html.includes(PUB.contactEmail), containsPhone: html.includes(PUB.contactPhone) })
    expect(status).toBe(200)
    expect(html).not.toContain(PUB.contactEmail)
    expect(html).not.toContain(PUB.contactPhone)
  })

  it('showEmail=true: the page shows the email (and not the phone)', async () => {
    const { status, html } = await page(shown.email.slug)
    expect(status).toBe(200)
    expect(html).toContain(`mailto:${shown.email.email}`)
    expect(html).not.toContain(shown.email.phone)
  })

  it('showPhone=true: the page shows the phone (and not the email)', async () => {
    const { status, html } = await page(shown.phone.slug)
    expect(status).toBe(200)
    expect(html).toContain(shown.phone.phone)
    expect(html).not.toContain(shown.phone.email)
  })
})

