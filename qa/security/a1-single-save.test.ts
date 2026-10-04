/**
 * A1 — one way to save: the Status field decides what is live, not which button was pressed.
 * (Admin pass 2026-10-04, found in a real browser on the production build.)
 *
 * The reviewed collections have Payload's drafts enabled, so the edit form carried two buttons,
 * "Save Draft" and "Publish changes", next to our own Status field (`reviewStatus`). The two
 * disagreed. "Save Draft" (`?draft=true`) writes a version and leaves the document row alone, so:
 *   - the board edits a published document, presses "Save Draft", gets "saved" — and the form
 *     reloads with the old text (the hook had marked that version `published`, which the edit view
 *     does not pick up);
 *   - the board sets Status to Archived and presses "Save Draft" — the form shows Archived, the
 *     document stays online;
 *   - an editor's "in review" lived only in a version; the row still said `draft`.
 *
 * The rule under test: a save always writes the document row, with or without `draft=true`
 * (`saveToLiveRow`, src/lib/access.ts). The requests below are the ones the two buttons send.
 */
import { afterEach, describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { buildDoc, REVIEWED_COLLECTIONS, type ReviewStatus, type ReviewedCollection } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const evidence: Record<string, unknown> = {}

const titleField = (c: string) => (c === 'experts' ? 'name' : 'title')

type Doc = { id: number; slug: string; reviewStatus: string; _status: string } & Record<string, unknown>

const created: Array<{ collection: string; id: number }> = []
afterEach(async () => {
  for (const { collection, id } of created.splice(0)) await api.delete(`/api/${collection}/${id}`, fx.tokens.admin)
})

let seq = 0
async function create(collection: ReviewedCollection, status: ReviewStatus): Promise<Doc> {
  const data = buildDoc(collection, { pillarId: fx.pillarId, topicId: fx.topicId }, status)
  // Own contact values: S1 counts experts by the seeded private addresses (EXPERT_PRIVATE).
  if (collection === 'experts') Object.assign(data, { contactEmail: `qa-a1-${Date.now()}-${seq++}@test.invalid`, contactPhone: '+43 1 555 0000' })
  const res = await api.post(`/api/${collection}`, data, fx.tokens.admin)
  if (res.status !== 201) throw new Error(`create ${collection}/${status}: ${res.status} ${res.text.slice(0, 300)}`)
  created.push({ collection, id: res.body.doc.id })
  return res.body.doc as Doc
}

/** The request the admin panel's "Save Draft" button sends. */
const saveDraft = (collection: string, id: number, data: Record<string, unknown>, token: string) =>
  api.patch(`/api/${collection}/${id}?draft=true&depth=0`, { ...data, _status: 'draft' }, token)

/** The document row — what the public site and every non-draft read is answered from. */
const row = async (collection: string, id: number) => (await api.get(`/api/${collection}/${id}?depth=0`, fx.tokens.admin)).body as Doc
/** What the admin panel's edit form loads. */
const form = async (collection: string, id: number) => (await api.get(`/api/${collection}/${id}?depth=0&draft=true`, fx.tokens.admin)).body as Doc

describe('A1 — a "Save Draft" request writes the document row', () => {
  it.each(REVIEWED_COLLECTIONS)('REGRESSION A1: %s — board edits a published document: the row, the form and the public API all carry the edit', async (collection) => {
    const doc = await create(collection, 'published')
    const field = titleField(collection)
    const edited = `A1-EDITED-${collection}-${Date.now()}`

    const res = await saveDraft(collection, doc.id, { [field]: edited }, fx.tokens.board)
    expect(res.status, res.text.slice(0, 200)).toBe(200)

    const live = await row(collection, doc.id)
    const inForm = await form(collection, doc.id)
    const anonymous = await api.get(`/api/${collection}/${doc.id}?depth=0`, null)
    evidence[`edit:${collection}`] = { row: live[field], form: inForm[field], anonymous: anonymous.body?.[field], status: [live.reviewStatus, live._status] }

    expect(live[field], 'document row').toBe(edited)
    expect(inForm[field], 'what the edit form reloads').toBe(edited)
    expect(anonymous.status).toBe(200)
    expect(anonymous.body[field], 'anonymous read').toBe(edited)
    expect([live.reviewStatus, live._status]).toEqual(['published', 'published'])
  })

  it.each(REVIEWED_COLLECTIONS)('REGRESSION A1: %s — board archives a published document: it is offline, not just marked archived in the form', async (collection) => {
    const doc = await create(collection, 'published')
    expect((await api.get(`/api/${collection}/${doc.id}?depth=0`, null)).status, 'public before').toBe(200)

    const res = await saveDraft(collection, doc.id, { reviewStatus: 'archived' }, fx.tokens.board)
    expect(res.status, res.text.slice(0, 200)).toBe(200)

    const live = await row(collection, doc.id)
    expect([live.reviewStatus, live._status], 'document row').toEqual(['archived', 'draft'])
    expect((await form(collection, doc.id)).reviewStatus, 'edit form').toBe('archived')
    expect((await api.get(`/api/${collection}/${doc.id}?depth=0`, null)).status, 'anonymous read after archiving').toBe(404)
    const listed = await api.get(`/api/${collection}?depth=0&limit=1&where[id][equals]=${doc.id}`, null)
    expect(listed.body.totalDocs, 'anonymous list after archiving').toBe(0)
  })

  it.each(REVIEWED_COLLECTIONS)('REGRESSION A1: %s — editor submits a draft for review: the row says in_review', async (collection) => {
    const doc = await create(collection, 'draft')
    const res = await saveDraft(collection, doc.id, { reviewStatus: 'in_review' }, fx.tokens.editor)
    expect(res.status, res.text.slice(0, 200)).toBe(200)
    const live = await row(collection, doc.id)
    expect([live.reviewStatus, live._status], 'document row').toEqual(['in_review', 'draft'])
    expect((await api.get(`/api/${collection}/${doc.id}?depth=0`, null)).status, 'still not public').toBe(404)
  })
})

describe('A1 — the Status field decides, whichever request is sent', () => {
  it('editor: the "Publish changes" request on a draft saves it and publishes nothing', async () => {
    const doc = await create('news', 'draft')
    const title = `A1-EDITOR-${Date.now()}`
    const res = await api.patch(`/api/news/${doc.id}?depth=0`, { title, _status: 'published' }, fx.tokens.editor)
    expect(res.status).toBe(200)
    const live = await row('news', doc.id)
    expect(live.title).toBe(title)
    expect([live.reviewStatus, live._status]).toEqual(['draft', 'draft'])
    expect((await api.get(`/api/news/${doc.id}?depth=0`, null)).status).toBe(404)
  })

  it('editor: asking for reviewStatus=published through a "Save Draft" request is still refused (S7 unchanged)', async () => {
    const doc = await create('news', 'draft')
    const res = await saveDraft('news', doc.id, { reviewStatus: 'published' }, fx.tokens.editor)
    expect(res.status).toBe(200)
    const live = await row('news', doc.id)
    expect([live.reviewStatus, live._status]).toEqual(['draft', 'draft'])
  })

  it('editor: a published document is still not editable through a "Save Draft" request (S7 unchanged)', async () => {
    const doc = await create('news', 'published')
    const res = await saveDraft('news', doc.id, { title: `A1-NOT-ALLOWED-${Date.now()}` }, fx.tokens.editor)
    expect(res.status).toBe(403)
    expect((await row('news', doc.id)).title).toBe(doc.title)
  })

  it('board: creating with Status = published through the "Save Draft" request publishes; with Status = draft it does not', async () => {
    for (const status of ['published', 'draft'] as const) {
      const data = { ...buildDoc('news', {}, status), _status: 'draft' }
      const res = await api.post('/api/news?draft=true&depth=0', data, fx.tokens.board)
      expect(res.status).toBe(201)
      created.push({ collection: 'news', id: res.body.doc.id })
      const live = await row('news', res.body.doc.id)
      expect([live.reviewStatus, live._status]).toEqual(status === 'published' ? ['published', 'published'] : ['draft', 'draft'])
      expect((await api.get(`/api/news/${res.body.doc.id}?depth=0`, null)).status).toBe(status === 'published' ? 200 : 404)
    }
  })

  it('a save is validated even when sent as a draft: a document without its required title is refused', async () => {
    const data: Record<string, unknown> = { ...buildDoc('news', {}, 'draft'), _status: 'draft' }
    delete data.title
    const res = await api.post('/api/news?draft=true&depth=0', data, fx.tokens.board)
    if (res.status === 201) created.push({ collection: 'news', id: res.body.doc.id })
    expect(res.status).toBe(400)
    writeEvidence('a1-single-save', evidence)
  })
})
