/**
 * C1 — `?draft=true` let anonymous / viewer callers read the versions tables.
 * (LAUNCH-CHECKLIST.md §1.1 "C1"; the 2026-10-04 admin-pass brief calls the same finding "F1".)
 *
 * With `draft=true`, Payload's `find` does not query the collection table at all: it queries the
 * versions table for rows with `latest = true` (payload/dist/collections/operations/find.js →
 * db.queryDrafts) and applies the collection's read rule to the *version*
 * (`version.reviewStatus = published`). `findByID` swaps the live row for a newer draft version the
 * same way (versions/drafts/replaceWithDraftIfAvailable.js). So below-editor callers were answered
 * with "the newest version whose own status says published" instead of "the live row". The two
 * differ whenever
 *   - a newer version sits over a live document (the admin panel's "Save draft" writes only a
 *     version and leaves the live row alone),
 *   - the latest version says `published` while the live row does not,
 *   - a document was deleted directly in the database: its versions stay behind with
 *     `parent_id = NULL` (ON DELETE SET NULL) and came back as documents with `id: null`.
 *
 * The rule under test: for anonymous and viewer, `draft=true` changes nothing — same documents and
 * same content as without it, by list, by id, as a `where` oracle and through a populated
 * relationship. Editor, board and admin keep the draft view; the admin panel depends on it.
 *
 * "The latest version differs from the live row" is produced by editing the version row in the
 * disposable test database, so these tests do not depend on which request happens to create that
 * state. One scenario goes through the real "Save draft" request as well.
 */
import { afterEach, describe, expect, inject, it } from 'vitest'
import { Api, qs } from '../harness/api'
import { buildDoc, REVIEWED_COLLECTIONS, type ReviewStatus, type ReviewedCollection } from '../harness/seed'
import { queryQaDb } from '../harness/db'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const DB = 'svo_qa_test_p0'
const evidence: Record<string, unknown> = {}

const BELOW_EDITOR = ['anonymous', 'viewer'] as const
const tokenOf = (actor: 'anonymous' | 'viewer' | 'editor' | 'board' | 'admin') => (actor === 'anonymous' ? null : fx.tokens[actor])

const titleField = (c: string) => (c === 'experts' ? 'name' : 'title')
const table = (c: string) => c.replace(/-/g, '_')

type Doc = { id: number; slug: string; title?: string; name?: string; reviewStatus: string }

let seq = 0
async function create(collection: ReviewedCollection, status: ReviewStatus, extra: Record<string, unknown> = {}): Promise<Doc> {
  const data = { ...buildDoc(collection, { pillarId: fx.pillarId, topicId: fx.topicId }, status), ...extra }
  // Own contact values: S1 counts experts by the seeded private addresses (EXPERT_PRIVATE).
  if (collection === 'experts') Object.assign(data, { contactEmail: `qa-c1-${Date.now()}-${seq++}@test.invalid`, contactPhone: '+43 1 555 0000' })
  const res = await api.post(`/api/${collection}`, data, fx.tokens.admin)
  if (res.status !== 201) throw new Error(`create ${collection}/${status}: ${res.status} ${res.text.slice(0, 300)}`)
  created.push({ collection, id: res.body.doc.id })
  return res.body.doc as Doc
}

const liveTitle = (collection: string, doc: Doc) => doc[titleField(collection) as 'title' | 'name'] as string

/**
 * Every document these tests create ends up with a version that contradicts its live row. Fixtures
 * are shared with the other test files, so each one is removed again (document and versions).
 */
const created: Array<{ collection: string; id: number }> = []
afterEach(async () => {
  for (const { collection, id } of created.splice(0)) await api.delete(`/api/${collection}/${id}`, fx.tokens.admin)
})

/**
 * Makes the latest version of `id` differ from the live row: new title/name, and optionally other
 * status values. Returns how many version rows were changed (must be 1 — otherwise the test would
 * pass without testing anything).
 */
async function editLatestVersion(
  collection: ReviewedCollection,
  id: number,
  change: { title?: string; reviewStatus?: ReviewStatus; _status?: 'draft' | 'published' },
): Promise<number> {
  const t = table(collection)
  const latest = await queryQaDb(DB, `SELECT id FROM "_${t}_v" WHERE parent_id = $1 AND latest = true`, [id])
  if (latest.rowCount !== 1) return latest.rowCount ?? 0
  const versionId = latest.rows[0].id as number
  if (change.title !== undefined) {
    // `title` is localized (its column lives in the _locales table); experts' `name` is not.
    const res =
      collection === 'experts'
        ? await queryQaDb(DB, `UPDATE "_${t}_v" SET version_name = $1 WHERE id = $2`, [change.title, versionId])
        : await queryQaDb(DB, `UPDATE "_${t}_v_locales" SET version_title = $1 WHERE _parent_id = $2`, [change.title, versionId])
    if (!res.rowCount) return 0
  }
  if (change.reviewStatus) await queryQaDb(DB, `UPDATE "_${t}_v" SET version_review_status = $1 WHERE id = $2`, [change.reviewStatus, versionId])
  if (change._status) await queryQaDb(DB, `UPDATE "_${t}_v" SET version__status = $1 WHERE id = $2`, [change._status, versionId])
  return 1
}

const listById = (collection: string, id: number, actor: Parameters<typeof tokenOf>[0], draft: boolean) =>
  api.get(`/api/${collection}?${qs({ depth: 0, limit: 5, where: { id: { equals: id } } })}${draft ? '&draft=true' : ''}`, tokenOf(actor))

describe('C1 — a newer version over a live document', () => {
  it.each(REVIEWED_COLLECTIONS)('REGRESSION C1: %s — anonymous / viewer get the live row with ?draft=true, never the newer version', async (collection) => {
    const doc = await create(collection, 'published')
    const field = titleField(collection)
    const marker = `C1-UNREVIEWED-${collection}-${Date.now()}`
    // `_status: draft` makes it the shape Payload itself stores for "unpublished changes", which is
    // the one findByID swaps in; the list path only needs `latest`.
    expect(await editLatestVersion(collection, doc.id, { title: marker, _status: 'draft' }), 'version row edited').toBe(1)

    // The newer version really is reachable through the draft view (otherwise nothing is being tested).
    for (const actor of ['editor', 'board', 'admin'] as const) {
      const draftView = await listById(collection, doc.id, actor, true)
      expect(draftView.body.docs[0]?.[field], `${actor} draft view`).toBe(marker)
    }

    const seen: Record<string, unknown> = {}
    for (const actor of BELOW_EDITOR) {
      const list = await listById(collection, doc.id, actor, true)
      const byId = await api.get(`/api/${collection}/${doc.id}?depth=0&draft=true`, tokenOf(actor))
      const oracle = await api.get(`/api/${collection}?${qs({ depth: 0, draft: true, where: { [field]: { equals: marker } } })}`, tokenOf(actor))
      seen[actor] = { list: list.body?.docs?.[0]?.[field], byId: byId.body?.[field], oracleTotal: oracle.body?.totalDocs }

      expect(list.status, `${actor} list`).toBe(200)
      expect(list.body.docs).toHaveLength(1)
      expect(list.body.docs[0][field], `${actor} list title`).toBe(liveTitle(collection, doc))
      expect(list.text, `${actor} list`).not.toContain(marker)

      expect(byId.status, `${actor} by id`).toBe(200)
      expect(byId.body[field], `${actor} by id title`).toBe(liveTitle(collection, doc))
      expect(byId.text, `${actor} by id`).not.toContain(marker)

      // Not usable as a search oracle on unpublished text either.
      expect(oracle.status, `${actor} where on the draft title`).toBe(200)
      expect(oracle.body.totalDocs, `${actor} where on the draft title`).toBe(0)
    }
    evidence[`newer-version:${collection}`] = seen
  })

  it('REGRESSION C1: the admin panel\'s real "Save draft" request over a live news item changes nothing for anonymous / viewer', async () => {
    const doc = await create('news', 'published')
    const draftTitle = `C1-SAVE-DRAFT-${Date.now()}`
    const save = await api.request('PATCH', `/api/news/${doc.id}?draft=true`, { json: { title: draftTitle, _status: 'draft' }, token: fx.tokens.board })
    expect(save.status, save.text.slice(0, 200)).toBe(200)

    for (const actor of BELOW_EDITOR) {
      const live = await listById('news', doc.id, actor, false)
      const draft = await listById('news', doc.id, actor, true)
      expect(draft.status).toBe(200)
      expect(draft.body, `${actor}: list with ?draft=true equals list without`).toEqual(live.body)

      const liveById = await api.get(`/api/news/${doc.id}?depth=0`, tokenOf(actor))
      const draftById = await api.get(`/api/news/${doc.id}?depth=0&draft=true`, tokenOf(actor))
      expect(draftById.status).toBe(liveById.status)
      expect(draftById.body, `${actor}: by id with ?draft=true equals by id without`).toEqual(liveById.body)
    }
  })

  it('REGRESSION C1: a relationship populated with ?draft=true carries the related live row, not its newer version', async () => {
    const roadmap = await create('roadmaps', 'published')
    const marker = `C1-POPULATED-${Date.now()}`
    expect(await editLatestVersion('roadmaps', roadmap.id, { title: marker, _status: 'draft' })).toBe(1)
    const article = await create('guide-articles', 'published', { relatedRoadmaps: [roadmap.id] })

    const editorView = await api.get(`/api/guide-articles/${article.id}?depth=1&draft=true`, fx.tokens.editor)
    expect(editorView.body.relatedRoadmaps?.[0]?.title, 'editor populate (draft view)').toBe(marker)

    for (const actor of BELOW_EDITOR) {
      for (const path of [`/api/guide-articles/${article.id}?depth=1&draft=true`, `/api/guide-articles?${qs({ depth: 1, draft: true, where: { id: { equals: article.id } } })}`]) {
        const res = await api.get(path, tokenOf(actor))
        expect(res.status, `${actor} ${path}`).toBe(200)
        expect(res.text, `${actor} ${path}`).not.toContain(marker)
        expect(res.text, `${actor} ${path}`).toContain(roadmap.title!)
      }
    }
  })
})

describe('C1 — the latest version says "published", the live row does not', () => {
  it.each(REVIEWED_COLLECTIONS)('REGRESSION C1: %s — an unpublished document stays hidden with ?draft=true', async (collection) => {
    const doc = await create(collection, 'draft')
    expect(await editLatestVersion(collection, doc.id, { reviewStatus: 'published', _status: 'published' })).toBe(1)

    const adminDraftView = await listById(collection, doc.id, 'admin', true)
    expect(adminDraftView.body.docs[0]?.reviewStatus, 'latest version (admin draft view)').toBe('published')
    const adminLiveView = await listById(collection, doc.id, 'admin', false)
    expect(adminLiveView.body.docs[0]?.reviewStatus, 'live row').toBe('draft')

    for (const actor of BELOW_EDITOR) {
      const list = await listById(collection, doc.id, actor, true)
      const byId = await api.get(`/api/${collection}/${doc.id}?depth=0&draft=true`, tokenOf(actor))
      expect(list.status, `${actor} list`).toBe(200)
      expect(list.body.totalDocs, `${actor} list`).toBe(0)
      expect(list.text, `${actor} list`).not.toContain(doc.slug)
      expect(byId.status, `${actor} by id`).toBe(404)
    }
  })
})

describe('C1 — versions whose document was deleted directly in the database', () => {
  it.each(REVIEWED_COLLECTIONS)('REGRESSION C1: %s — orphaned versions are not served (no `id: null` documents)', async (collection) => {
    const t = table(collection)
    const doc = await create(collection, 'published')
    const versionIds = (await queryQaDb(DB, `SELECT id FROM "_${t}_v" WHERE parent_id = $1`, [doc.id])).rows.map((r) => r.id as number)
    expect(versionIds.length, 'the document has versions').toBeGreaterThan(0)
    try {
      await queryQaDb(DB, `DELETE FROM "${t}" WHERE id = $1`, [doc.id])
      const orphans = await queryQaDb(DB, `SELECT count(*)::int AS n FROM "_${t}_v" WHERE id = ANY($1) AND parent_id IS NULL AND latest = true`, [versionIds])
      expect(orphans.rows[0].n, 'an orphaned latest version exists').toBeGreaterThan(0)

      const seen: Record<string, unknown> = {}
      for (const actor of BELOW_EDITOR) {
        const live = await api.get(`/api/${collection}?depth=0&limit=500`, tokenOf(actor))
        const draft = await api.get(`/api/${collection}?depth=0&limit=500&draft=true`, tokenOf(actor))
        const docs = (draft.body?.docs ?? []) as Array<{ id: unknown }>
        seen[actor] = { liveTotal: live.body?.totalDocs, draftTotal: draft.body?.totalDocs, nullIds: docs.filter((d) => d.id == null).length }

        expect(draft.status, `${actor} list`).toBe(200)
        expect(docs.filter((d) => d.id == null), `${actor}: documents without an id`).toHaveLength(0)
        expect(draft.text, `${actor}: deleted document's title`).not.toContain(liveTitle(collection, doc))
        expect(draft.body.totalDocs, `${actor}: ?draft=true lists exactly what the live list does`).toBe(live.body.totalDocs)
        expect(docs.map((d) => d.id).sort(), `${actor}: same ids`).toEqual((live.body.docs as Array<{ id: unknown }>).map((d) => d.id).sort())
      }
      evidence[`orphans:${collection}`] = seen
    } finally {
      // Other test files (and the admin list) must not inherit these rows.
      await queryQaDb(DB, `DELETE FROM "_${t}_v" WHERE id = ANY($1)`, [versionIds])
    }
  })
})

describe('C1 — controls', () => {
  it('editor, board and admin still read unpublished work with ?draft=true (the admin panel needs it)', async () => {
    for (const actor of ['editor', 'board', 'admin'] as const) {
      for (const status of ['draft', 'in_review', 'archived'] as const) {
        const res = await api.get(`/api/news/${fx.docs.news[status]}?depth=0&draft=true`, tokenOf(actor))
        expect(res.status, `${actor} news/${status}`).toBe(200)
      }
    }
    writeEvidence('c1-draft-versions-leak', evidence)
  })

  it('anonymous / viewer: ?draft=true and no draft parameter list the same published documents in every reviewed collection', async () => {
    for (const collection of REVIEWED_COLLECTIONS) {
      for (const actor of BELOW_EDITOR) {
        const live = await api.get(`/api/${collection}?depth=0&limit=500&sort=id`, tokenOf(actor))
        const draft = await api.get(`/api/${collection}?depth=0&limit=500&sort=id&draft=true`, tokenOf(actor))
        expect(draft.status, `${actor} ${collection}`).toBe(200)
        expect(draft.body.docs, `${actor} ${collection}`).toEqual(live.body.docs)
        expect(live.body.docs.every((d: { reviewStatus: string }) => d.reviewStatus === 'published'), `${actor} ${collection}: only published`).toBe(true)
      }
    }
  })
})
