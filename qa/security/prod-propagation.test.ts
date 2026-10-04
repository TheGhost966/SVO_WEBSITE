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
 */
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Api } from '../harness/api'
import { startApp, type RunningApp } from '../harness/app'
import { cloneTemplate } from '../harness/db'
import { writeEvidence } from '../harness/evidence'
import { ensureProdBuild, prodEnv, PROD_PORT } from '../harness/prodBuild'
import { buildDoc, PASSWORD, uniq } from '../harness/seed'

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
})
