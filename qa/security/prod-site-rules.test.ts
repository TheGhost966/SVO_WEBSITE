/**
 * Public-site rules from the rulings of 2026-10-04 (phase 3b), on a production build:
 *
 *  - F3: an unknown, archived or deleted document answers a real 404 on every dynamic route in all
 *    three languages — not "200 with the not-found text" (a `loading.tsx` above the detail routes
 *    made Next start the response before the page could call notFound()).
 *  - Homepage copy: German text entered in Site Settings must not replace the built-in Arabic and
 *    English wording.
 *  - Guide articles render their cross-links (roadmaps, services, experts) — published targets
 *    only, and never an expert's private data.
 *  - The quiz is only offered when no combination of answers ends without a roadmap.
 *  - The app band is gone.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Api } from '../harness/api'
import { startApp, type RunningApp } from '../harness/app'
import { cloneTemplate } from '../harness/db'
import { writeEvidence } from '../harness/evidence'
import { APP_ROOT } from '../harness/paths'
import { ensureProdBuild, prodEnv, PROD_PORT } from '../harness/prodBuild'
import { buildDoc, PASSWORD, uniq } from '../harness/seed'

const DB = 'svo_qa_test_prod_site_rules'
const ADMIN_EMAIL = 'qa-site-rules-admin@test.invalid'
const WITHIN_MS = 15_000
const LOCALES = ['de', 'ar', 'en'] as const
type Locale = (typeof LOCALES)[number]

let app: RunningApp
let api: Api
let token = ''
let pillar: { id: number; slug: string }
let topic: { id: number; slug: string }
const evidence: Record<string, unknown> = {}

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
const HOME = LOCALES.map((l) => `/${l}`)
/** `common.notFound` in src/messages — what the localized not-found page says. */
const NOT_FOUND_TEXT = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(path.join(APP_ROOT, 'src/messages', `${l}.json`), 'utf8')).common.notFound as string]),
) as Record<Locale, string>

const page = async (p: string) => {
  const res = await fetch(app.baseUrl + p, { redirect: 'manual', signal: AbortSignal.timeout(180_000) })
  return { path: p, status: res.status, html: await res.text() }
}
type Page = Awaited<ReturnType<typeof page>>

async function settles(paths: string[], ok: (p: Page) => boolean): Promise<boolean> {
  const started = Date.now()
  for (;;) {
    if ((await Promise.all(paths.map(page))).every(ok)) return true
    if (Date.now() - started > WITHIN_MS) return false
    await new Promise((r) => setTimeout(r, 500))
  }
}

const h1 = (html: string) => (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim()

async function create(collection: string, status: 'published' | 'draft', extra: Record<string, unknown> = {}) {
  const res = await api.post(`/api/${collection}`, { ...buildDoc(collection, { pillarId: pillar.id, topicId: topic.id }, status), ...extra }, token)
  if (res.status !== 201) throw new Error(`create ${collection}: ${res.status} ${res.text.slice(0, 300)}`)
  return res.body.doc as { id: number; slug: string; title?: string; name?: string }
}

beforeAll(async () => {
  await cloneTemplate(DB)
  await ensureProdBuild()
  app = await startApp({
    name: 'prod-site-rules',
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
  writeEvidence('prod-site-rules', evidence)
  await app?.stop()
})

describe('F3 — what does not exist answers 404', () => {
  it.each(COLLECTIONS)('REGRESSION F3: %s — an unknown slug is a 404 in de, ar and en, with the site around it', async (collection) => {
    for (const locale of LOCALES) {
      const p = await page(DETAIL[collection](locale, 'qa-this-slug-does-not-exist'))
      expect(p.status, p.path).toBe(404)
      expect(p.html, `${p.path}: no loading placeholder`).not.toMatch(/Loading…|Loading\.\.\./)
      // The not-found page of this language is in the response (Next renders it in the browser
      // for a route that is generated on demand, so it is looked for as text, not as markup).
      expect(p.html, `${p.path}: not-found text`).toContain(NOT_FOUND_TEXT[locale])
    }
  })

  it.each(COLLECTIONS)('REGRESSION F3: %s — archived, then deleted: 404, not 200 with an empty page', async (collection) => {
    const doc = await create(collection, 'published')
    const paths = LOCALES.map((l) => DETAIL[collection](l, doc.slug))
    expect(await settles(paths, (p) => p.status === 200), `${collection}: published → 200`).toBe(true)

    expect((await api.patch(`/api/${collection}/${doc.id}`, { reviewStatus: 'archived' }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.status === 404), `${collection}: archived → 404`).toBe(true)

    expect((await api.patch(`/api/${collection}/${doc.id}`, { reviewStatus: 'published' }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.status === 200), `${collection}: published again → 200`).toBe(true)

    expect((await api.delete(`/api/${collection}/${doc.id}`, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.status === 404), `${collection}: deleted → 404`).toBe(true)
  })

  it('REGRESSION F3: unknown guide topic, unknown service pillar and unknown top-level path are 404 with the site layout', async () => {
    const seen: Record<string, number> = {}
    for (const locale of LOCALES) {
      for (const path of [
        `/${locale}/${locale === 'de' ? 'oesterreich-guide' : 'guide'}/qa-no-such-topic`,
        `/${locale}/${locale === 'de' ? 'leistungen' : 'services'}/qa-no-such-pillar`,
        `/${locale}/qa-no-such-page`,
        `/${locale}/qa/no/such/page`,
      ]) {
        const p = await page(path)
        seen[path] = p.status
        expect(p.status, path).toBe(404)
        expect(p.html, `${path}: not-found text`).toContain(NOT_FOUND_TEXT[locale])
      }
    }
    evidence.unknownPaths = seen
  })

  it('control: the list pages still answer 200', async () => {
    for (const path of ['/de/nachrichten', '/ar/news', '/en/events', '/de/experten', `/en/guide/${topic.slug}`, '/de/anleitungen', '/en/jobs', '/de/leistungen']) {
      expect((await page(path)).status, path).toBe(200)
    }
  })
})

describe('homepage', () => {
  it('REGRESSION T2-08: German homepage copy in Site Settings does not replace the Arabic and English built-in texts', async () => {
    const before = Object.fromEntries((await Promise.all(HOME.map(page))).map((p) => [p.path, h1(p.html)]))
    expect(before['/ar'], 'Arabic headline exists').not.toBe('')
    expect(before['/ar'], 'Arabic and German built-in headlines differ').not.toBe(before['/de'])

    const hero = uniq('QAHOME-HERO-DE')
    const band = uniq('QAHOME-BAND-DE')
    const card = uniq('QAHOME-CARD-DE')
    const save = await api.post(
      '/api/globals/site-settings?locale=de',
      { homeGroup: { heroHeadline: hero, ctaBandHeading: band, ctaBandCtaLabel: 'QA', helpCards: [{ title: card, href: '/contact' }] } },
      token,
    )
    expect(save.status, save.text.slice(0, 300)).toBe(200)

    expect(await settles(['/de'], (p) => p.html.includes(hero) && p.html.includes(band) && p.html.includes(card)), 'German homepage shows the German copy').toBe(true)
    // Give the other two locales the same chance to pick the change up, then look at them.
    await new Promise((r) => setTimeout(r, 2000))
    for (const p of await Promise.all(['/ar', '/en'].map(page))) {
      expect(p.status).toBe(200)
      for (const marker of [hero, band, card]) expect(p.html, `${p.path} must not show the German text`).not.toContain(marker)
      expect(h1(p.html), `${p.path}: built-in headline of this language`).toBe(before[p.path])
    }

    // An Arabic value, once entered, is used on the Arabic page only.
    const heroAr = uniq('QAHOME-HERO-AR')
    expect((await api.post('/api/globals/site-settings?locale=ar', { homeGroup: { heroHeadline: heroAr } }, token)).status).toBe(200)
    expect(await settles(['/ar'], (p) => p.html.includes(heroAr)), 'Arabic homepage shows the Arabic copy').toBe(true)
    expect((await page('/en')).html).not.toContain(heroAr)
    expect(h1((await page('/en')).html)).toBe(before['/en'])
    evidence.homepageHeadlines = before
  })

  it('REGRESSION 3b-7: the app band is not on the homepage', async () => {
    for (const p of await Promise.all(HOME.map(page))) {
      expect(p.status).toBe(200)
      expect(p.html, p.path).not.toContain('app-band-heading')
      expect(p.html, p.path).not.toMatch(/App Store|Google Play/i)
    }
  })

  it('REGRESSION 3b-7: the quiz is offered only when every combination of answers finds a published roadmap', async () => {
    const quizPaths = ['/de/meine-situation', '/ar/quiz', '/en/quiz']
    const linksToQuiz = (p: Page) => /href="[^"]*\/(quiz|meine-situation)"/.test(p.html)

    // One published roadmap covering a single tag: most answers would find nothing.
    const partial = await create('roadmaps', 'published', { quizMatches: ['housing'] })
    expect(await settles(HOME, (p) => p.html.includes(partial.slug)), 'roadmap section on the homepage').toBe(true)
    for (const p of await Promise.all(quizPaths.map(page))) expect(p.status, `${p.path} while there are dead ends`).toBe(404)
    for (const p of await Promise.all(HOME.map(page))) expect(linksToQuiz(p), `${p.path} links to the quiz`).toBe(false)

    // A second roadmap that covers every tag: no dead ends left.
    const all = ['newly_arrived', 'job_seeking', 'learning_german', 'housing', 'qualification_recognition', 'family', 'health', 'residence_permit', 'studying']
    const full = await create('roadmaps', 'published', { quizMatches: all })
    expect(await settles(quizPaths, (p) => p.status === 200), 'quiz available').toBe(true)
    expect(await settles(HOME, linksToQuiz), 'homepage links to the quiz').toBe(true)

    // Unpublish it: the dead ends are back, and so is the 404.
    expect((await api.patch(`/api/roadmaps/${full.id}`, { reviewStatus: 'archived' }, token)).status).toBe(200)
    expect(await settles(quizPaths, (p) => p.status === 404), 'quiz withdrawn').toBe(true)
    expect(await settles(HOME, (p) => !linksToQuiz(p)), 'homepage no longer links to the quiz').toBe(true)
    await api.delete(`/api/roadmaps/${full.id}`, token)
    await api.delete(`/api/roadmaps/${partial.id}`, token)
  })
})

describe('guide article cross-links (BRIEF-AMENDMENT-01 §3)', () => {
  it('REGRESSION T2-14: related roadmaps, services and experts are linked — published ones only, no private expert data', async () => {
    const privateEmail = `qa-crosslink-${Date.now()}@test.invalid`
    const roadmap = await create('roadmaps', 'published')
    const hiddenRoadmap = await create('roadmaps', 'draft')
    const service = await create('services', 'published')
    const expert = await create('experts', 'published', { contactEmail: privateEmail, contactPhone: '+43 1 555 0199' })
    const hiddenExpert = await create('experts', 'draft', { contactEmail: `hidden-${privateEmail}`, contactPhone: '+43 1 555 0198' })
    const article = await create('guide-articles', 'published', {
      relatedRoadmaps: [roadmap.id, hiddenRoadmap.id],
      relatedServices: [service.id],
      relatedExperts: [expert.id, hiddenExpert.id],
    })

    const paths = LOCALES.map((l) => DETAIL['guide-articles'](l, article.slug))
    expect(await settles(paths, (p) => p.status === 200 && p.html.includes(roadmap.title!)), 'article page with its related roadmap').toBe(true)
    for (const p of await Promise.all(paths.map(page))) {
      const locale = p.path.split('/')[1] as Locale
      expect(p.html, `${p.path}: roadmap link`).toContain(`href="${DETAIL.roadmaps(locale, roadmap.slug)}"`)
      expect(p.html, `${p.path}: service link`).toContain(`href="${DETAIL.services(locale, service.slug)}"`)
      expect(p.html, `${p.path}: expert link`).toContain(`href="${DETAIL.experts(locale, expert.slug)}"`)
      expect(p.html).toContain(service.title!)
      expect(p.html).toContain(expert.name!)
      expect(p.html, `${p.path}: unpublished roadmap`).not.toContain(hiddenRoadmap.title!)
      expect(p.html, `${p.path}: unpublished roadmap link`).not.toContain(hiddenRoadmap.slug)
      expect(p.html, `${p.path}: unpublished expert`).not.toContain(hiddenExpert.name!)
      expect(p.html, `${p.path}: private e-mail`).not.toContain(privateEmail)
      expect(p.html, `${p.path}: private phone`).not.toContain('555 0199')
    }

    // Renaming the roadmap reaches the article page; archiving it removes the link.
    const renamed = uniq('QACROSS-ROADMAP-RENAMED')
    expect((await api.patch(`/api/roadmaps/${roadmap.id}`, { title: renamed }, token)).status).toBe(200)
    expect(await settles(paths, (p) => p.html.includes(renamed)), 'renamed roadmap on the article page').toBe(true)
    expect((await api.patch(`/api/roadmaps/${roadmap.id}`, { reviewStatus: 'archived' }, token)).status).toBe(200)
    expect(await settles(paths, (p) => !p.html.includes(renamed)), 'archived roadmap no longer linked').toBe(true)
  })
})
