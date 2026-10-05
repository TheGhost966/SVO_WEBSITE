/**
 * S7 — editor publishing bypass, and S8 — partial PATCH overwriting `_status`.
 *
 * Expected behaviour comes from the documented workflow:
 *   editor creates/edits a draft → sets in_review → board/admin publishes (or archives).
 * Nothing in it lets an editor change content that is already live, or its publication state.
 * So for an editor, a document that is `published` or `archived` must stay exactly as it is —
 * live content, reviewStatus and _status — whatever the request; drafts / in_review stay editable.
 *
 * S8: a PATCH that omits reviewStatus must leave reviewStatus AND _status as they were.
 *
 * Every scenario uses a freshly created document, so the public page check (/de/nachrichten/<slug>)
 * is never served from the 60-second page cache. "Live" is checked three ways: the database row
 * (review_status, _status), the anonymous REST read (what the site's queries see), and the page HTML.
 */
import { describe, expect, inject, it } from 'vitest'
import { Api, qs } from '../harness/api'
import { buildDoc, REVIEWED_COLLECTIONS, type ReviewStatus, type ReviewedCollection } from '../harness/seed'
import { queryQaDb } from '../harness/db'
import { waitForMail } from '../harness/smtpSink'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const DB = 'svo_qa_test_p0'
const evidence: Record<string, unknown> = {}

const titleField = (c: string) => (c === 'experts' ? 'name' : 'title')
const table = (c: string) => c.replace(/-/g, '_')

async function dbState(collection: string, id: string | number) {
  const t = table(collection)
  const main = (await queryQaDb(DB, `SELECT review_status, _status FROM "${t}" WHERE id = $1`, [id])).rows[0]
  const versions = (await queryQaDb(DB, `SELECT count(*)::int AS n FROM "_${t}_v" WHERE parent_id = $1`, [id])).rows[0]
  return { reviewStatus: main?.review_status, _status: main?._status, versionCount: versions?.n as number }
}

let seq = 0
async function create(collection: ReviewedCollection, status: ReviewStatus, token = fx.tokens.admin) {
  const data = buildDoc(collection, { pillarId: fx.pillarId, topicId: fx.topicId }, status)
  // Experts built by buildDoc carry the seed's private contact values (EXPERT_PRIVATE); give these
  // their own, so S1's "exactly one expert has this address" assertions stay meaningful.
  if (collection === 'experts') Object.assign(data, { contactEmail: `qa-s7-${Date.now()}-${seq++}@test.invalid`, contactPhone: '+43 1 777 0000' })
  const res = await api.post(`/api/${collection}`, data, token)
  if (res.status !== 201) throw new Error(`create ${collection}/${status}: ${res.status} ${res.text.slice(0, 300)}`)
  return res.body.doc as { id: string | number; slug: string; title?: string; name?: string; reviewStatus: string }
}

/** What anonymous visitors (and the site's own queries) get for this document. */
async function publicView(collection: string, id: string | number) {
  const res = await api.get(`/api/${collection}/${id}?depth=0`)
  return { status: res.status, title: res.body?.[titleField(collection)] as string | undefined }
}

async function newsPage(slug: string) {
  const res = await fetch(`${fx.baseUrl}/de/nachrichten/${slug}`, { signal: AbortSignal.timeout(180_000) })
  return { status: res.status, html: await res.text() }
}

/** Asserts a published news doc is untouched: DB state, anonymous read and public page. */
async function expectUntouchedLiveNews(doc: { id: string | number; slug: string; title?: string }, newTitle: string, label: string) {
  const db = await dbState('news', doc.id)
  const pub = await publicView('news', doc.id)
  const page = await newsPage(doc.slug)
  ;(evidence[label] as Record<string, unknown>) = { ...(evidence[label] as object), db, public: pub, pageHasOld: page.html.includes(doc.title!), pageHasNew: page.html.includes(newTitle) }
  expect(db.reviewStatus, `${label}: review_status`).toBe('published')
  expect(db._status, `${label}: _status`).toBe('published')
  expect(pub.status, `${label}: anonymous read`).toBe(200)
  expect(pub.title, `${label}: live title`).toBe(doc.title)
  expect(page.status, `${label}: page`).toBe(200)
  expect(page.html, `${label}: page shows original title`).toContain(doc.title!)
  expect(page.html, `${label}: page must not show the editor's change`).not.toContain(newTitle)
}

describe('S7 — editor against an ALREADY-PUBLISHED document', () => {
  it('REGRESSION S7 (1): editing content without touching reviewStatus is refused; live content unchanged', async () => {
    const doc = await create('news', 'published')
    const newTitle = `EDITOR-UNREVIEWED-1-${Date.now()}`
    const res = await api.patch(`/api/news/${doc.id}`, { title: newTitle }, fx.tokens.editor)
    evidence.s7_1 = { response: res.status }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    await expectUntouchedLiveNews(doc, newTitle, 's7_1')
  })

  it('REGRESSION S7 (2): editing content and sending reviewStatus=published is refused; live content unchanged', async () => {
    const doc = await create('news', 'published')
    const newTitle = `EDITOR-UNREVIEWED-2-${Date.now()}`
    const res = await api.patch(`/api/news/${doc.id}`, { title: newTitle, reviewStatus: 'published' }, fx.tokens.editor)
    evidence.s7_2 = { response: res.status }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    await expectUntouchedLiveNews(doc, newTitle, 's7_2')
  })

  it('REGRESSION S7 (3): reviewStatus=archived is refused; the document stays published and live', async () => {
    const doc = await create('news', 'published')
    const newTitle = `EDITOR-UNREVIEWED-3-${Date.now()}`
    const res = await api.patch(`/api/news/${doc.id}`, { title: newTitle, reviewStatus: 'archived' }, fx.tokens.editor)
    evidence.s7_3 = { response: res.status }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    await expectUntouchedLiveNews(doc, newTitle, 's7_3')
  })

  it('REGRESSION S7 (4): reviewStatus=in_review is refused; the live document is NOT taken offline', async () => {
    const doc = await create('news', 'published')
    const newTitle = `EDITOR-UNREVIEWED-4-${Date.now()}`
    const res = await api.patch(`/api/news/${doc.id}`, { title: newTitle, reviewStatus: 'in_review' }, fx.tokens.editor)
    evidence.s7_4 = { response: res.status }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    await expectUntouchedLiveNews(doc, newTitle, 's7_4')
  })

  it('REGRESSION S7 (5): "Save draft" (?draft=true) is refused; no draft version is written; live content unchanged', async () => {
    const doc = await create('news', 'published')
    const before = await dbState('news', doc.id)
    const newTitle = `EDITOR-UNREVIEWED-5-${Date.now()}`
    const res = await api.request('PATCH', `/api/news/${doc.id}?draft=true`, { json: { title: newTitle, _status: 'draft' }, token: fx.tokens.editor })
    const after = await dbState('news', doc.id)
    evidence.s7_5 = { response: res.status, versionsBefore: before.versionCount, versionsAfter: after.versionCount }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    expect(after.versionCount).toBe(before.versionCount)
    await expectUntouchedLiveNews(doc, newTitle, 's7_5')
  })

  it('REGRESSION S7: bulk PATCH (where=…) cannot reach a published document either', async () => {
    const doc = await create('news', 'published')
    const newTitle = `EDITOR-UNREVIEWED-BULK-${Date.now()}`
    const res = await api.patch(`/api/news?${qs({ where: { id: { equals: doc.id } } })}`, { title: newTitle }, fx.tokens.editor)
    evidence.s7_bulk = { response: res.status, docsUpdated: res.body?.docs?.length ?? null }
    expect(res.body?.docs ?? []).toHaveLength(0)
    await expectUntouchedLiveNews(doc, newTitle, 's7_bulk')
  })

  it('REGRESSION S7: restoring an older version onto a published document is refused', async () => {
    const doc = await create('news', 'published')
    const versions = await api.get(`/api/news/versions?${qs({ where: { parent: { equals: doc.id } } })}`, fx.tokens.admin)
    const versionId = versions.body.docs[0].id
    const res = await api.request('POST', `/api/news/versions/${versionId}`, { token: fx.tokens.editor })
    evidence.s7_restore = { response: res.status }
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    await expectUntouchedLiveNews(doc, '__never__', 's7_restore')
  })

  it.each(REVIEWED_COLLECTIONS)('REGRESSION S7: %s — editor content edit on a published document is refused and changes nothing', async (collection) => {
    const doc = await create(collection, 'published')
    const field = titleField(collection)
    const res = await api.patch(`/api/${collection}/${doc.id}`, { [field]: `EDITOR-UNREVIEWED-${collection}` }, fx.tokens.editor)
    const db = await dbState(collection, doc.id)
    const pub = await publicView(collection, doc.id)
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    expect(db).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    expect(pub.title).toBe(doc[field as 'title' | 'name'])
  })

  it.each(REVIEWED_COLLECTIONS)('REGRESSION S7: %s — editor cannot revive or edit an ARCHIVED document', async (collection) => {
    const doc = await create(collection, 'archived')
    const res = await api.patch(`/api/${collection}/${doc.id}`, { reviewStatus: 'draft', [titleField(collection)]: 'EDITOR-REVIVE' }, fx.tokens.editor)
    const db = await dbState(collection, doc.id)
    expect(res.status, res.text.slice(0, 200)).toBe(403)
    expect(db.reviewStatus).toBe('archived')
  })
})

describe('S7 — the documented workflow still works', () => {
  it('editor creating a document with reviewStatus=published gets a draft that is not live', async () => {
    const doc = await create('news', 'published', fx.tokens.editor)
    const db = await dbState('news', doc.id)
    expect(doc.reviewStatus).toBe('draft')
    expect(db).toMatchObject({ reviewStatus: 'draft', _status: 'draft' })
    expect((await publicView('news', doc.id)).status).toBe(404)
  })

  it('editor edits a draft, cannot self-publish it, submits it for review (board is emailed); it is not live yet', async () => {
    const doc = await create('news', 'draft', fx.tokens.editor)
    const title = `QA-S7-FLOW-${Date.now()}`
    const edit = await api.patch(`/api/news/${doc.id}`, { title }, fx.tokens.editor)
    expect(edit.status, edit.text.slice(0, 200)).toBe(200)
    const selfPublish = await api.patch(`/api/news/${doc.id}`, { reviewStatus: 'published' }, fx.tokens.editor)
    expect(selfPublish.status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'draft', _status: 'draft' })
    const submit = await api.patch(`/api/news/${doc.id}`, { reviewStatus: 'in_review' }, fx.tokens.editor)
    expect(submit.status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'in_review', _status: 'draft' })
    expect(await waitForMail((m) => m.data.includes(title))).toBeDefined()
    expect((await publicView('news', doc.id)).status).toBe(404)
    // editor may keep editing while it is in review
    expect((await api.patch(`/api/news/${doc.id}`, { title: `${title}-v2` }, fx.tokens.editor)).status).toBe(200)
  })

  it.each(['board', 'admin'] as const)('%s publishes an in_review document → live; and can edit live content directly', async (role) => {
    const doc = await create('news', 'in_review', fx.tokens.editor)
    const pub = await api.patch(`/api/news/${doc.id}`, { reviewStatus: 'published' }, fx.tokens[role])
    expect(pub.status, pub.text.slice(0, 200)).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    const newTitle = `QA-S7-${role}-EDIT-${Date.now()}`
    const edit = await api.patch(`/api/news/${doc.id}`, { title: newTitle }, fx.tokens[role])
    expect(edit.status, edit.text.slice(0, 200)).toBe(200)
    expect((await publicView('news', doc.id)).title).toBe(newTitle)
    const page = await newsPage(doc.slug)
    expect(page.html).toContain(newTitle)
  })
})

describe('S8 — PATCH requests that omit reviewStatus keep reviewStatus AND _status', () => {
  const LEXICAL_BODY = {
    root: {
      type: 'root', format: '', indent: 0, version: 1, direction: null,
      children: [{ type: 'paragraph', format: '', indent: 0, version: 1, direction: null, textFormat: 0, children: [{ type: 'text', text: 'QA S8 body', format: 0, detail: 0, mode: 'normal', style: '', version: 1 }] }],
    },
  }

  it.each([
    ['title only', { title: 'QA S8 new title' }],
    ['body only (rich text)', { body: LEXICAL_BODY }],
    ['another ordinary field only (featured)', { featured: true }],
    ['excerpt only', { excerpt: 'QA S8 excerpt' }],
  ])('REGRESSION S8: admin PATCH %s on a PUBLISHED document → still published / _status published, still live', async (_label, patch) => {
    const doc = await create('news', 'published')
    const res = await api.patch(`/api/news/${doc.id}`, patch, fx.tokens.admin)
    expect(res.status, res.text.slice(0, 200)).toBe(200)
    const db = await dbState('news', doc.id)
    ;(evidence.s8 ??= {} as Record<string, unknown>) as Record<string, unknown>
    ;(evidence.s8 as Record<string, unknown>)[`published:${_label}`] = db
    expect(db).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    expect(res.body.doc).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    expect((await publicView('news', doc.id)).status).toBe(200)
  })

  it.each(REVIEWED_COLLECTIONS)('REGRESSION S8: %s — board PATCH of only the title on a PUBLISHED document keeps published/_status published', async (collection) => {
    const doc = await create(collection, 'published')
    const res = await api.patch(`/api/${collection}/${doc.id}`, { [titleField(collection)]: `QA S8 ${collection}` }, fx.tokens.board)
    expect(res.status, res.text.slice(0, 200)).toBe(200)
    expect(await dbState(collection, doc.id)).toMatchObject({ reviewStatus: 'published', _status: 'published' })
  })

  it.each([
    ['draft', 'draft'],
    ['in_review', 'draft'],
    ['archived', 'draft'],
  ] as const)('REGRESSION S8: admin PATCH title only on a %s document → reviewStatus unchanged, _status %s', async (status, expectedStatus) => {
    const doc = await create('news', status)
    const res = await api.patch(`/api/news/${doc.id}`, { title: `QA S8 ${status}` }, fx.tokens.admin)
    expect(res.status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: status, _status: expectedStatus })
  })

  it('REGRESSION S8: admin BULK PATCH (where=…) of only the title on a PUBLISHED document keeps published/_status published', async () => {
    const doc = await create('news', 'published')
    const res = await api.patch(`/api/news?${qs({ where: { id: { equals: doc.id } } })}`, { title: 'QA S8 bulk' }, fx.tokens.admin)
    expect(res.status, res.text.slice(0, 200)).toBe(200)
    expect(res.body.docs).toHaveLength(1)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    expect((await publicView('news', doc.id)).title).toBe('QA S8 bulk')
  })

  it('REGRESSION S8: editor PATCH title only on a DRAFT document → stays draft / _status draft', async () => {
    const doc = await create('news', 'draft', fx.tokens.editor)
    const res = await api.patch(`/api/news/${doc.id}`, { title: 'QA S8 editor draft' }, fx.tokens.editor)
    expect(res.status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'draft', _status: 'draft' })
  })

  it('PATCH with reviewStatus explicitly still drives _status (admin): draft → published → archived', async () => {
    const doc = await create('news', 'draft')
    expect((await api.patch(`/api/news/${doc.id}`, { reviewStatus: 'published' }, fx.tokens.admin)).status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'published', _status: 'published' })
    expect((await publicView('news', doc.id)).status).toBe(200)
    expect((await api.patch(`/api/news/${doc.id}`, { reviewStatus: 'archived' }, fx.tokens.admin)).status).toBe(200)
    expect(await dbState('news', doc.id)).toMatchObject({ reviewStatus: 'archived', _status: 'draft' })
    expect((await publicView('news', doc.id)).status).toBe(404)
    writeEvidence('s7-s8-review-workflow', evidence)
  })
})
