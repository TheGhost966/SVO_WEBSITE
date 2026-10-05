/**
 * S5 / S6 — role × collection × operation access matrix over REST.
 *
 * CURRENT_POLICY below is transcribed from the `access` blocks in src/collections/*.ts and
 * src/lib/access.ts. The matrix test proves the running app enforces exactly that policy, cell by cell.
 *
 * Remediation (policy changes made deliberately, each with its access-rule diff):
 *   S2: contact-submissions create  public → editorPlus (form posts via its server action).
 *   S5: media / board-members delete loggedIn → editorPlus (viewer is read-only).
 *   S6: reviewed collections read    publishedOrLoggedIn → publishedOrEditorPlus (viewer sees only
 *       what the public sees); readVersions → editorPlus.
 *   N3: jobs delete                  editorPlus → adminOnly.
 *   S7: reviewed collections update — editors only on draft / in_review documents (board/admin on
 *       all). The matrix's update cells target fresh draft documents; published/archived targets are
 *       covered in s7-s8-review-workflow.test.ts.
 *   3b (ruling of 2026-10-04): media / board-members delete editorPlus → boardPlus; categories,
 *       guide-topics and service-pillars create / update / delete → boardPlus (editors keep read).
 *       These three were not in the matrix before; what they hold goes live without review.
 * History: the S5/S6 "REPRODUCES" blocks are inverted below on the same requests.
 * The matrix is the spec, not something to edit until green.
 */
import { afterAll, describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { ACTORS, REVIEW_STATUSES, REVIEWED_COLLECTIONS, buildDoc, createAs, type Actor, type ReviewStatus } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const ctx = { pillarId: fx.pillarId, topicId: fx.topicId }
const tokenOf = (a: Actor) => (a === 'anonymous' ? null : fx.tokens[a])

type Rule = 'public' | 'loggedIn' | 'editorPlus' | 'boardPlus' | 'adminOnly' | 'publishedOrEditorPlus'
type Policy = { read: Rule; create: Rule; update: Rule; delete: Rule }

const CURRENT_POLICY: Record<string, Policy> = {
  media: { read: 'public', create: 'editorPlus', update: 'editorPlus', delete: 'boardPlus' },
  'board-members': { read: 'public', create: 'editorPlus', update: 'editorPlus', delete: 'boardPlus' },
  // Taxonomy: no review workflow, every change is live at once — board and admin only.
  categories: { read: 'public', create: 'boardPlus', update: 'boardPlus', delete: 'boardPlus' },
  'guide-topics': { read: 'public', create: 'boardPlus', update: 'boardPlus', delete: 'boardPlus' },
  'service-pillars': { read: 'public', create: 'boardPlus', update: 'boardPlus', delete: 'boardPlus' },
  news: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  events: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  services: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  'guide-articles': { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  roadmaps: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  experts: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  // N3 fix: jobs delete editorPlus → adminOnly (same as every other reviewed collection).
  jobs: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  pages: { read: 'publishedOrEditorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
  // S2 fix: create is no longer public (the contact form writes via its server action / Local API).
  'contact-submissions': { read: 'editorPlus', create: 'editorPlus', update: 'editorPlus', delete: 'adminOnly' },
}
const COLLECTIONS = Object.keys(CURRENT_POLICY)
const isReviewed = (c: string) => (REVIEWED_COLLECTIONS as readonly string[]).includes(c)

function allows(rule: Rule, actor: Actor, status?: ReviewStatus): boolean {
  switch (rule) {
    case 'public':
      return true
    case 'loggedIn':
      return actor !== 'anonymous'
    case 'editorPlus':
      return ['editor', 'board', 'admin'].includes(actor)
    case 'boardPlus':
      return ['board', 'admin'].includes(actor)
    case 'adminOnly':
      return actor === 'admin'
    case 'publishedOrEditorPlus':
      return ['editor', 'board', 'admin'].includes(actor) || status === 'published'
  }
}

const ok = (status: number) => status >= 200 && status < 300
const verdict = (status: number) => (ok(status) ? 'ALLOW' : [401, 403, 404].includes(status) ? 'DENY' : `ERR`)

function updatePatch(collection: string): Record<string, unknown> {
  switch (collection) {
    case 'experts':
    case 'board-members':
    case 'categories':
      return { name: 'QA updated' }
    case 'media':
      return { alt: 'QA updated alt' }
    case 'contact-submissions':
      return { status: 'read' }
    default:
      return { title: 'QA updated' }
  }
}

async function freshDocId(collection: string): Promise<string | number> {
  const res = await createAs(api, collection, fx.tokens.admin, ctx, 'draft')
  if (!res.body?.doc?.id) throw new Error(`admin could not create ${collection}: ${res.status} ${res.text.slice(0, 300)}`)
  return res.body.doc.id
}

type Cell = { op: string; actor: Actor; status: number; verdict: string; expected: 'ALLOW' | 'DENY'; detail?: string }
const results: Record<string, Cell[]> = {}
const record = (collection: string, cell: Omit<Cell, 'verdict'>) => {
  ;(results[collection] ??= []).push({ ...cell, verdict: verdict(cell.status) })
}

/** Seeded doc ids per status for reviewed collections; one id for the others. */
function seededTargets(collection: string): Array<{ label: string; id: string | number; status?: ReviewStatus }> {
  if (isReviewed(collection)) {
    const docs = fx.docs[collection as (typeof REVIEWED_COLLECTIONS)[number]]
    return REVIEW_STATUSES.map((s) => ({ label: s, id: docs[s], status: s }))
  }
  const id = {
    media: fx.mediaId,
    'board-members': fx.boardMemberId,
    'contact-submissions': fx.contactSubmissionId,
    categories: fx.categoryId,
    'guide-topics': fx.topicId,
    'service-pillars': fx.pillarId,
  }[collection]!
  return [{ label: 'doc', id }]
}

describe.each(COLLECTIONS)('role matrix: %s', (collection) => {
  const policy = CURRENT_POLICY[collection]

  it.each(ACTORS)('%s — read (list + by id per review status)', async (actor) => {
    const token = tokenOf(actor)
    const list = await api.get(`/api/${collection}?depth=0&limit=200`, token)
    const listedIds = new Set((list.body?.docs ?? []).map((d: { id: unknown }) => d.id))
    for (const t of seededTargets(collection)) {
      const expected = allows(policy.read, actor, t.status) ? 'ALLOW' : 'DENY'
      const res = await api.get(`/api/${collection}/${t.id}?depth=0`, token)
      record(collection, { op: `read:${t.label}`, actor, status: res.status, expected })
      expect(verdict(res.status), `${actor} read ${collection}/${t.label} → HTTP ${res.status}`).toBe(expected)
      // The list must agree with by-id access (a denied doc must not appear in the list).
      if (ok(list.status)) expect(listedIds.has(t.id), `${actor} list ${collection} includes ${t.label}`).toBe(expected === 'ALLOW')
    }
    const listExpected = policy.read === 'editorPlus' || policy.read === 'adminOnly' ? (allows(policy.read, actor) ? 'ALLOW' : 'DENY') : 'ALLOW'
    record(collection, { op: 'list', actor, status: list.status, expected: listExpected, detail: `${list.body?.totalDocs ?? '-'} docs` })
    expect(verdict(list.status), `${actor} list ${collection} → HTTP ${list.status}`).toBe(listExpected)
  })

  it.each(ACTORS)('%s — create', async (actor) => {
    const res = await createAs(api, collection, tokenOf(actor), ctx, 'draft')
    const expected = allows(policy.create, actor) ? 'ALLOW' : 'DENY'
    record(collection, { op: 'create', actor, status: res.status, expected })
    expect(verdict(res.status), `${actor} create ${collection} → HTTP ${res.status} ${res.text.slice(0, 200)}`).toBe(expected)
  })

  it.each(ACTORS)('%s — update', async (actor) => {
    const id = await freshDocId(collection)
    const res = await api.patch(`/api/${collection}/${id}`, updatePatch(collection), tokenOf(actor))
    const expected = allows(policy.update, actor) ? 'ALLOW' : 'DENY'
    record(collection, { op: 'update', actor, status: res.status, expected })
    expect(verdict(res.status), `${actor} update ${collection} → HTTP ${res.status} ${res.text.slice(0, 200)}`).toBe(expected)
  })

  it.each(ACTORS)('%s — delete', async (actor) => {
    const id = await freshDocId(collection)
    const res = await api.delete(`/api/${collection}/${id}`, tokenOf(actor))
    const expected = allows(policy.delete, actor) ? 'ALLOW' : 'DENY'
    record(collection, { op: 'delete', actor, status: res.status, expected })
    expect(verdict(res.status), `${actor} delete ${collection} → HTTP ${res.status} ${res.text.slice(0, 200)}`).toBe(expected)
    // Prove the delete really happened (or didn't) from the admin's point of view.
    const after = await api.get(`/api/${collection}/${id}?depth=0`, fx.tokens.admin)
    expect(after.status, `${collection}/${id} after ${actor} delete`).toBe(expected === 'ALLOW' ? 404 : 200)
  })
})

describe('S5 — delete on media / board-members', () => {
  it.each(['media', 'board-members'])('REGRESSION S5: viewer can NOT delete a %s document (403, document still there)', async (collection) => {
    const id = await freshDocId(collection)
    const res = await api.delete(`/api/${collection}/${id}`, fx.tokens.viewer)
    const after = await api.get(`/api/${collection}/${id}?depth=0`, fx.tokens.admin)
    writeEvidence(`s5-viewer-delete-${collection}`, { deleteStatus: res.status, deleteBody: res.body, adminReadAfter: after.status })
    expect(res.status).toBe(403)
    expect(after.status).toBe(200)
  })

  // 3b: an editor no longer deletes media or board members.
  const EXPECTED_DELETE: Record<Actor, number> = { anonymous: 403, viewer: 403, editor: 403, board: 200, admin: 200 }
  for (const collection of ['media', 'board-members']) {
    it.each(ACTORS)(`REGRESSION S5: ${collection} delete — %s gets the exact expected status`, async (actor) => {
      const id = await freshDocId(collection)
      const res = await api.delete(`/api/${collection}/${id}`, tokenOf(actor))
      const after = await api.get(`/api/${collection}/${id}?depth=0`, fx.tokens.admin)
      expect(res.status, `${actor} delete ${collection}`).toBe(EXPECTED_DELETE[actor])
      expect(after.status, `${collection} after ${actor} delete`).toBe(EXPECTED_DELETE[actor] === 200 ? 404 : 200)
    })
  }

  it.each(['media', 'board-members'])('viewer still reads %s (read-only role keeps read access)', async (collection) => {
    const res = await api.get(`/api/${collection}?depth=0`, fx.tokens.viewer)
    expect(res.status).toBe(200)
    expect(res.body.totalDocs).toBeGreaterThan(0)
  })

  it('control: viewer cannot delete news / experts / jobs / contact-submissions', async () => {
    for (const collection of ['news', 'experts', 'jobs', 'contact-submissions']) {
      const id = await freshDocId(collection)
      const res = await api.delete(`/api/${collection}/${id}`, fx.tokens.viewer)
      expect(res.status, collection).toBe(403)
    }
  })
})

describe('S6 — visibility of unpublished content', () => {
  it.each(REVIEWED_COLLECTIONS)('REGRESSION S6: viewer can NOT read draft, in_review or archived %s (by id, ?draft=true, list) but still reads published', async (collection) => {
    const seen: Record<string, { byId: number; byIdDraft: number; inList: boolean }> = {}
    const list = await api.get(`/api/${collection}?depth=0&limit=200`, fx.tokens.viewer)
    const draftList = await api.get(`/api/${collection}?depth=0&limit=200&draft=true`, fx.tokens.viewer)
    const listed = new Set([...(list.body?.docs ?? []), ...(draftList.body?.docs ?? [])].map((d: { id: unknown }) => d.id))
    for (const status of REVIEW_STATUSES) {
      const id = fx.docs[collection][status]
      const res = await api.get(`/api/${collection}/${id}?depth=0`, fx.tokens.viewer)
      const resDraft = await api.get(`/api/${collection}/${id}?depth=0&draft=true`, fx.tokens.viewer)
      seen[status] = { byId: res.status, byIdDraft: resDraft.status, inList: listed.has(id) }
      const visible = status === 'published'
      expect(res.status, `${collection}/${status}`).toBe(visible ? 200 : 404)
      expect(resDraft.status, `${collection}/${status} ?draft=true`).toBe(visible ? 200 : 404)
      expect(listed.has(id), `${collection}/${status} in list`).toBe(visible)
    }
    writeEvidence(`s6-viewer-unpublished-${collection}`, seen)
  })

  const VISIBLE: Record<Actor, ReviewStatus[]> = {
    anonymous: ['published'],
    viewer: ['published'],
    editor: ['draft', 'in_review', 'published', 'archived'],
    board: ['draft', 'in_review', 'published', 'archived'],
    admin: ['draft', 'in_review', 'published', 'archived'],
  }
  it.each(ACTORS)('REGRESSION S6: %s — exact visibility per review status across all 8 reviewed collections', async (actor) => {
    for (const collection of REVIEWED_COLLECTIONS) {
      for (const status of REVIEW_STATUSES) {
        const res = await api.get(`/api/${collection}/${fx.docs[collection][status]}?depth=0`, tokenOf(actor))
        expect(res.status, `${actor} ${collection}/${status}`).toBe(VISIBLE[actor].includes(status) ? 200 : 404)
      }
    }
  })

  it('REGRESSION S6: viewer filtering for unpublished work (where[reviewStatus][not_equals]=published) returns nothing', async () => {
    const res = await api.get('/api/news?depth=0&limit=200&where[reviewStatus][not_equals]=published', fx.tokens.viewer)
    expect(res.status).toBe(200)
    expect(res.body.totalDocs).toBe(0)
  })

  it('REGRESSION S6: version history (GET /{collection}/versions) is editor/board/admin only', async () => {
    const statuses: Record<string, Record<Actor, number>> = {}
    for (const collection of REVIEWED_COLLECTIONS) {
      statuses[collection] = {} as Record<Actor, number>
      for (const actor of ACTORS) statuses[collection][actor] = (await api.get(`/api/${collection}/versions?depth=0&limit=5`, tokenOf(actor))).status
    }
    writeEvidence('s6-versions-access', statuses)
    for (const collection of REVIEWED_COLLECTIONS) {
      expect(statuses[collection], collection).toEqual({ anonymous: 403, viewer: 403, editor: 200, board: 200, admin: 200 })
    }
  })

  it('REGRESSION S6: a published document does not leak unpublished related documents to viewer/anonymous (depth=1 populate)', async () => {
    const article = await api.post(
      '/api/guide-articles',
      { ...buildDoc('guide-articles', { topicId: fx.topicId }, 'published'), relatedRoadmaps: [fx.docs.roadmaps.draft, fx.docs.roadmaps.published] },
      fx.tokens.admin,
    )
    expect(article.status, article.text.slice(0, 200)).toBe(201)
    for (const actor of ['anonymous', 'viewer'] as const) {
      const res = await api.get(`/api/guide-articles/${article.body.doc.id}?depth=1`, tokenOf(actor))
      expect(res.status).toBe(200)
      const populated = (res.body.relatedRoadmaps ?? []).filter((r: unknown) => r && typeof r === 'object') as Array<{ id: unknown }>
      expect(populated.map((r) => r.id), actor).not.toContain(fx.docs.roadmaps.draft)
      expect(res.text, actor).not.toContain(fx.slugs.roadmaps.draft)
    }
    const editorView = await api.get(`/api/guide-articles/${article.body.doc.id}?depth=1`, fx.tokens.editor)
    expect(editorView.body.relatedRoadmaps.map((r: { id: unknown }) => r.id)).toContain(fx.docs.roadmaps.draft)
  })

  it('control: anonymous sees only published documents', async () => {
    for (const collection of REVIEWED_COLLECTIONS) {
      for (const status of ['draft', 'in_review', 'archived'] as const) {
        const res = await api.get(`/api/${collection}/${fx.docs[collection][status]}?depth=0&draft=true`)
        expect(res.status, `${collection}/${status}`).toBe(404)
      }
    }
  })
})

afterAll(() => {
  const ops = ['list', ...['draft', 'in_review', 'published', 'archived', 'doc'].map((s) => `read:${s}`), 'create', 'update', 'delete']
  let md = '# Role matrix (generated by qa/security/s5-s6-role-matrix.test.ts)\n\n'
  md += 'Cell = observed HTTP status. `!` marks a cell that differs from CURRENT_POLICY.\n\n'
  for (const collection of COLLECTIONS) {
    const cells = results[collection] ?? []
    if (!cells.length) continue
    const present = ops.filter((op) => cells.some((c) => c.op === op))
    md += `## ${collection}\n\n| actor | ${present.join(' | ')} |\n|---|${present.map(() => '---').join('|')}|\n`
    for (const actor of ACTORS) {
      const row = present.map((op) => {
        const c = cells.find((x) => x.op === op && x.actor === actor)
        if (!c) return ''
        return `${c.status}${c.verdict === c.expected ? '' : '!'}${c.detail ? ` (${c.detail})` : ''}`
      })
      md += `| ${actor} | ${row.join(' | ')} |\n`
    }
    md += '\n'
  }
  writeEvidence('role-matrix.md', md)
  writeEvidence('role-matrix', results)
})
