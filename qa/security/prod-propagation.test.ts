/**
 * Admin → public site propagation, on a production build (admin pass 2026-10-04, findings A3/A4).
 *
 * The public pages are statically cached and only change when a Payload hook busts their cache tag
 * (src/hooks/revalidateOnPublish.ts), so this can only be tested against `next build` + `next start`.
 * Found in a real browser on the production build:
 *   - an edit to an already published document never reached the site — the hook only busted the
 *     cache when a document moved into or out of `published`;
 *   - an archived (or unpublished) news article stayed online at its URL — its query was tagged
 *     with a constant that no hook ever busts.
 *
 * Per collection with a detail page, in German, Arabic and English: publish → the page shows it;
 * edit → the page shows the new text; archive → the text is gone; delete → gone.
 *
 * The independent tester of the same pass (T2-02, T2-04, T2-05, T2-07, T2-13) added: partners,
 * categories and pages had no cache hook at all; a cover image stored on the server itself came out
 * as a broken image; the events list logged a missing translation.
 */
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Api } from '../harness/api'
import { startApp, type RunningApp } from '../harness/app'
import { cloneTemplate } from '../harness/db'
import { writeEvidence } from '../harness/evidence'
import { ensureProdBuild, prodEnv, PROD_PORT } from '../harness/prodBuild'
import { buildDoc, mediaForm, PASSWORD, uniq } from '../harness/seed'

const DB = 'svo_qa_test_prod_propagation'
const ADMIN_EMAIL = 'qa-propagation-admin@test.invalid'
/** How long a change may take to show. Measured: well under a second. */
const WITHIN_MS = 15_000

const LOCALES = ['de', 'ar', 'en'] as const
type Locale = (typeof LOCALES)[number]

let app: RunningApp
let api: Api
let token = ''
let pillar: { id: number; slug: string }
let topic: { id: number; slug: string }
const evidence: Record<string, unknown> = {}

/** Public URL of a document's detail page; German has its own path names (src/i18n/routing.ts). */
const DETAIL: Record<string, (locale: Locale, slug: string) => string> = {
  news: (l, s) => `/${l}/${l === 'de' ? 'nachrichten' : 'news'}/${s}`,
  events: (l, s) => `/${l}/${l === 'de' ? 'veranstaltungen' : 'events'}/${s}`,
  services: (l, s) => `/${l}/${l === 'de' ? 'leistungen' : 'services'}/${pillar.slug}/${s}`,
  'guide-articles': (l, s) => `/${l}/${l === 'de' ? 'oesterreich-guide' : 'guide'}/${topic.slug}/${s}`,
  roadmaps: (l, s) => `/${l}/${l === 'de' ? 'anleitungen' : 'roadmaps'}/${s}`,
  experts: (l, s) => `/${l}/${l === 'de' ? 'experten' : 'experts'}/${s}`,
  jobs: (l, s) => `/${l}/${l === 'de' ? 'stellenangebote' : 'jobs'}/${s}`,
}
const COLLECTIONS = Object.keys(DETAIL)
const titleField = (c: string) => (c === 'experts' ? 'name' : 'title')

const page = async (p: string) => {
  const res = await fetch(app.baseUrl + p, { redirect: 'manual', signal: AbortSignal.timeout(180_000) })
  return { status: res.status, html: await res.text() }
}

/** Polls every page until `ok` holds for all of them; returns the seconds it took, or null. */
async function settles(paths: string[], ok: (p: { status: number; html: string }) => boolean): Promise<number | null> {
  const started = Date.now()
  for (;;) {
    const pages = await Promise.all(paths.map(page))
    if (pages.every(ok)) return Math.round((Date.now() - started) / 100) / 10
    if (Date.now() - started > WITHIN_MS) return null
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function publish(collection: string, marker: string) {
  const data = { ...buildDoc(collection, { pillarId: pillar.id, topicId: topic.id }, 'published'), [titleField(collection)]: marker }
  const res = await api.post(`/api/${collection}`, data, token)
  if (res.status !== 201) throw new Error(`create ${collection}: ${res.status} ${res.text.slice(0, 300)}`)
  return res.body.doc as { id: number; slug: string }
}

describe('production: what the board saves reaches the public site', () => {
  beforeAll(async () => {
    await cloneTemplate(DB)
    await ensureProdBuild()
    app = await startApp({
      name: 'prod-propagation',
      port: PROD_PORT,
      command: 'start',
      env: prodEnv(DB, randomBytes(32).toString('hex'), { CREATE_ADMIN_ON_BOOT: '1', CREATE_ADMIN_EMAIL: ADMIN_EMAIL, CREATE_ADMIN_PASSWORD: PASSWORD, CREATE_ADMIN_NAME: 'QA Admin' }),
    })
    api = new Api(app.baseUrl)
    token = await api.login(ADMIN_EMAIL, PASSWORD)
    const p = await api.post('/api/service-pillars', { title: 'QA Pillar', slug: uniq('qa-pillar'), order: 1 }, token)
    const t = await api.post('/api/guide-topics', { title: 'QA Topic', slug: uniq('qa-topic'), order: 1 }, token)
    if (p.status !== 201 || t.status !== 201) throw new Error(`fixtures: pillar ${p.status}, topic ${t.status}`)
    pillar = p.body.doc
    topic = t.body.doc
  })
  afterAll(async () => {
    writeEvidence('prod-propagation', evidence)
    await app?.stop()
  })

  it.each(COLLECTIONS)('REGRESSION A3: %s — publish, edit and archive each show on /de, /ar and /en', async (collection) => {
    const first = uniq(`QAPROP-FIRST-${collection}`)
    const second = uniq(`QAPROP-SECOND-${collection}`)
    const doc = await publish(collection, first)
    const paths = LOCALES.map((l) => DETAIL[collection](l, doc.slug))
    const timings: Record<string, number | null> = {}

    timings.published = await settles(paths, (p) => p.status === 200 && p.html.includes(first))
    expect(timings.published, `${collection}: published document visible on ${paths.join(', ')}`).not.toBeNull()

    const edit = await api.patch(`/api/${collection}/${doc.id}`, { [titleField(collection)]: second }, token)
    expect(edit.status).toBe(200)
    timings.edited = await settles(paths, (p) => p.html.includes(second) && !p.html.includes(first))
    expect(timings.edited, `${collection}: an edit to a published document shows on the site`).not.toBeNull()

    const archive = await api.patch(`/api/${collection}/${doc.id}`, { reviewStatus: 'archived' }, token)
    expect(archive.status).toBe(200)
    timings.archived = await settles(paths, (p) => !p.html.includes(second) && !p.html.includes(first))
    expect(timings.archived, `${collection}: archived content is no longer served`).not.toBeNull()

    evidence[collection] = { paths, secondsUntilVisible: timings, statusAfterArchive: (await Promise.all(paths.map(page))).map((p) => p.status) }
  })

  it.each(COLLECTIONS)('REGRESSION A3: %s — an unpublished draft never shows, and a deleted document disappears', async (collection) => {
    const marker = uniq(`QAPROP-DELETE-${collection}`)
    const doc = await publish(collection, marker)
    const paths = LOCALES.map((l) => DETAIL[collection](l, doc.slug))
    expect(await settles(paths, (p) => p.html.includes(marker)), `${collection}: visible before the delete`).not.toBeNull()

    // A second document that is only ever a draft / in review: its page must never carry its text.
    const hidden = uniq(`QAPROP-HIDDEN-${collection}`)
    const draft = await api.post(`/api/${collection}`, { ...buildDoc(collection, { pillarId: pillar.id, topicId: topic.id }, 'draft'), [titleField(collection)]: hidden }, token)
    expect(draft.status).toBe(201)
    const draftPaths = LOCALES.map((l) => DETAIL[collection](l, draft.body.doc.slug))
    for (const p of await Promise.all(draftPaths.map(page))) expect(p.html, `${collection}: draft`).not.toContain(hidden)
    expect((await api.patch(`/api/${collection}/${draft.body.doc.id}`, { reviewStatus: 'in_review' }, token)).status).toBe(200)
    for (const p of await Promise.all(draftPaths.map(page))) expect(p.html, `${collection}: in review`).not.toContain(hidden)

    expect((await api.delete(`/api/${collection}/${doc.id}`, token)).status).toBe(200)
    expect(await settles(paths, (p) => !p.html.includes(marker)), `${collection}: deleted content is no longer served`).not.toBeNull()
    await api.delete(`/api/${collection}/${draft.body.doc.id}`, token)
  })

  const upload = async () => {
    const res = await api.request('POST', '/api/media', { token, form: mediaForm('QA propagation image') })
    if (res.status !== 201) throw new Error(`upload: ${res.status} ${res.text.slice(0, 300)}`)
    return res.body.doc as { id: number; url: string; filename: string }
  }

  it('REGRESSION T2-02: a partner shows on the partner page when created, renamed and deleted', async () => {
    const paths = ['/de/partner', '/ar/partners', '/en/partners']
    const first = uniq('QAPROP-PARTNER-FIRST')
    const second = uniq('QAPROP-PARTNER-SECOND')
    // The page is in the cache before the partner exists — the state the tester found it in.
    for (const p of await Promise.all(paths.map(page))) expect(p.status).toBe(200)

    const logo = await upload()
    const created = await api.post('/api/partners', { name: first, logo: logo.id, type: 'partner', order: 1 }, token)
    expect(created.status, created.text.slice(0, 200)).toBe(201)
    const id = created.body.doc.id
    expect(await settles(paths, (p) => p.html.includes(first)), 'new partner listed').not.toBeNull()

    expect((await api.patch(`/api/partners/${id}`, { name: second }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.html.includes(second) && !p.html.includes(first)), 'renamed partner listed').not.toBeNull()

    expect((await api.delete(`/api/partners/${id}`, token)).status).toBe(200)
    expect(await settles(paths, (p) => !p.html.includes(second)), 'deleted partner gone').not.toBeNull()
    await api.delete(`/api/media/${logo.id}`, token)
  })

  it('REGRESSION T2-05: renaming a category shows on the news list', async () => {
    const paths = ['/de/nachrichten', '/ar/news', '/en/news']
    const first = uniq('QAPROP-CAT-FIRST')
    const second = uniq('QAPROP-CAT-SECOND')
    const category = await api.post('/api/categories', { name: first, slug: uniq('qaprop-cat'), type: 'news' }, token)
    expect(category.status, category.text.slice(0, 200)).toBe(201)
    const news = await api.post('/api/news', { ...buildDoc('news', {}, 'published'), category: category.body.doc.id }, token)
    expect(news.status, news.text.slice(0, 200)).toBe(201)
    expect(await settles(paths, (p) => p.html.includes(first)), 'category on the news list').not.toBeNull()

    expect((await api.patch(`/api/categories/${category.body.doc.id}`, { name: second }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.html.includes(second) && !p.html.includes(first)), 'renamed category on the news list').not.toBeNull()

    await api.delete(`/api/news/${news.body.doc.id}`, token)
    await api.delete(`/api/categories/${category.body.doc.id}`, token)
  })

  it('REGRESSION T2-07: publishing and editing the "about" page shows on /ueber-uns and /about', async () => {
    const paths = ['/de/ueber-uns', '/ar/about', '/en/about']
    const first = uniq('QAPROP-ABOUT-FIRST')
    const second = uniq('QAPROP-ABOUT-SECOND')
    for (const p of await Promise.all(paths.map(page))) expect(p.status).toBe(200)

    const created = await api.post('/api/pages', { title: first, slug: 'about', reviewStatus: 'published' }, token)
    expect(created.status, created.text.slice(0, 200)).toBe(201)
    expect(await settles(paths, (p) => p.html.includes(first)), 'published page picked up').not.toBeNull()

    expect((await api.patch(`/api/pages/${created.body.doc.id}`, { title: second }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.html.includes(second) && !p.html.includes(first)), 'edit picked up').not.toBeNull()

    expect((await api.delete(`/api/pages/${created.body.doc.id}`, token)).status).toBe(200)
    expect(await settles(paths, (p) => !p.html.includes(second)), 'deleted page gone').not.toBeNull()
  })

  it('REGRESSION T2-04: a cover image stored on this server is served through the image optimiser, not as a broken image', async () => {
    const image = await upload()
    const news = await api.post('/api/news', { ...buildDoc('news', {}, 'published'), coverImage: image.id }, token)
    expect(news.status, news.text.slice(0, 200)).toBe(201)
    const path = DETAIL.news('de', news.body.doc.slug)
    expect(await settles([path], (p) => p.status === 200 && p.html.includes('/_next/image?url=')), 'page with an optimised image').not.toBeNull()

    const html = (await page(path)).html.replace(/&amp;/g, '&')
    const sources = [...html.matchAll(/\/_next\/image\?url=([^&"\s]+)&w=(\d+)&q=(\d+)/g)].filter((m) => decodeURIComponent(m[1]).includes(image.filename.replace(/\.png$/, '')))
    expect(sources.length, 'the cover image is on the page').toBeGreaterThan(0)
    const statuses: Record<string, number> = {}
    for (const m of sources.slice(0, 3)) {
      // next/image answers 400 for an absolute URL whose host is not allow-listed.
      expect(decodeURIComponent(m[1]), 'image URL is relative to this site').toMatch(/^\//)
      const res = await fetch(`${app.baseUrl}${m[0]}`, { signal: AbortSignal.timeout(180_000) })
      await res.arrayBuffer()
      statuses[m[0]] = res.status
      expect(res.status, m[0]).toBe(200)
    }
    evidence.coverImage = statuses
    await api.delete(`/api/news/${news.body.doc.id}`, token)
    await api.delete(`/api/media/${image.id}`, token)
  })

  it('REGRESSION T2-13: the events list renders in all three languages without a missing translation', async () => {
    // The category filter — and with it the "all categories" label — only renders once an event
    // category exists.
    const name = uniq('QAPROP-EVENTCAT')
    const category = await api.post('/api/categories', { name, slug: uniq('qaprop-eventcat'), type: 'event' }, token)
    expect(category.status, category.text.slice(0, 200)).toBe(201)
    const paths = ['/de/veranstaltungen', '/ar/events', '/en/events']
    expect(await settles(paths, (p) => p.status === 200 && p.html.includes(name)), 'category filter rendered').not.toBeNull()
    for (const p of await Promise.all(paths.map(page))) expect(p.html, 'untranslated message key').not.toContain('events.filterAll')
    expect(app.output()).not.toMatch(/MISSING_MESSAGE/)
    await api.delete(`/api/categories/${category.body.doc.id}`, token)
  })
})
