/**
 * N3 — Jobs delete authorization.
 *
 * Intended model (derived, not assumed — see SECURITY_REMEDIATION.md "N3"):
 *   - every other collection with the review workflow (news, events, services, guide-articles,
 *     roadmaps, experts, pages) uses `delete: admin only`; Jobs was modelled on News/Events
 *     (src/collections/Jobs.ts) and records no reason to differ;
 *   - ADMIN-HANDBUCH §2: editors cannot publish, every publication needs board approval — removing
 *     live content without review is the same bypass in reverse;
 *   - BRIEF-AMENDMENT-01 §2.5: expired postings are handled by the expiry filter / archiving, so
 *     editors have no maintenance need to delete.
 *   ⇒ delete: admin only. anonymous / viewer / editor / board → 403. Board takes a job offline by
 *     archiving it (the documented route), which stays possible.
 *
 * Verified three ways after every attempt: the `jobs` table row, the anonymous REST read, and (for
 * published jobs) the public page /de/stellenangebote/<slug>. Each case uses a fresh job, so the
 * page is never served from cache.
 */
import { describe, expect, inject, it } from 'vitest'
import { Api, qs } from '../harness/api'
import { ACTORS, REVIEW_STATUSES, buildDoc, type Actor, type ReviewStatus } from '../harness/seed'
import { queryQaDb } from '../harness/db'
import { writeEvidence } from '../harness/evidence'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const DB = 'svo_qa_test_p0'
const tokenOf = (a: Actor) => (a === 'anonymous' ? null : fx.tokens[a])
const CAN_DELETE: Record<Actor, boolean> = { anonymous: false, viewer: false, editor: false, board: false, admin: true }
const results: Record<string, unknown> = {}

async function createJob(status: ReviewStatus, token = fx.tokens.admin) {
  const res = await api.post('/api/jobs', buildDoc('jobs', {}, status), token)
  if (res.status !== 201) throw new Error(`create job ${status}: ${res.status} ${res.text.slice(0, 300)}`)
  return res.body.doc as { id: number | string; slug: string; title: string }
}

const rowExists = async (id: number | string) =>
  (await queryQaDb(DB, 'SELECT count(*)::int AS n FROM jobs WHERE id = $1', [id])).rows[0].n === 1

async function jobPage(slug: string) {
  const res = await fetch(`${fx.baseUrl}/de/stellenangebote/${slug}`, { signal: AbortSignal.timeout(180_000) })
  return { status: res.status, html: await res.text() }
}

describe('N3 — DELETE /api/jobs/:id by role × review status', () => {
  for (const status of REVIEW_STATUSES) {
    it.each(ACTORS)(`REGRESSION N3: %s deleting a ${status} job`, async (actor) => {
      const job = await createJob(status)
      const res = await api.delete(`/api/jobs/${job.id}`, tokenOf(actor))
      const exists = await rowExists(job.id)
      const anon = await api.get(`/api/jobs/${job.id}?depth=0`)
      const entry: Record<string, unknown> = { response: res.status, rowStillExists: exists, anonymousRead: anon.status }
      const page = status === 'published' ? await jobPage(job.slug) : null
      if (page) entry.publicPage = { status: page.status, showsJob: page.html.includes(job.title) }
      results[`${status}:${actor}`] = entry // recorded before asserting, so evidence is complete either way
      if (page) {
        if (CAN_DELETE[actor]) expect(page.html, 'deleted job must not render').not.toContain(job.title)
        else expect(page.html, 'job must still be live').toContain(job.title)
      }

      if (CAN_DELETE[actor]) {
        expect(res.status, res.text.slice(0, 200)).toBe(200)
        expect(exists).toBe(false)
        expect(anon.status).toBe(404)
      } else {
        expect(res.status, `${actor} delete ${status} job: ${res.text.slice(0, 200)}`).toBe(403)
        expect(exists, 'row must survive').toBe(true)
        expect(anon.status).toBe(status === 'published' ? 200 : 404)
      }
    })
  }
})

describe('N3 — bulk DELETE /api/jobs?where=…', () => {
  it.each(ACTORS)('REGRESSION N3: %s bulk-deleting one job of every review status', async (actor) => {
    const jobs = await Promise.all(REVIEW_STATUSES.map((s) => createJob(s)))
    const ids = jobs.map((j) => j.id)
    const res = await api.delete(`/api/jobs?${qs({ where: { id: { in: ids.join(',') } } })}`, tokenOf(actor))
    const remaining = (await queryQaDb(DB, 'SELECT count(*)::int AS n FROM jobs WHERE id = ANY($1)', [ids])).rows[0].n
    results[`bulk:${actor}`] = { response: res.status, deletedReported: res.body?.docs?.length ?? null, rowsRemaining: remaining }
    if (CAN_DELETE[actor]) {
      expect(res.status, res.text.slice(0, 200)).toBe(200)
      expect(remaining).toBe(0)
    } else {
      expect(res.status, `${actor} bulk delete: ${res.text.slice(0, 200)}`).toBe(403)
      expect(remaining).toBe(ids.length)
    }
  })
})

describe('N3 — legitimate Job operations are preserved', () => {
  it('editor: create a draft job, edit it, submit it for review — but cannot delete it', async () => {
    const job = await createJob('draft', fx.tokens.editor)
    expect((await api.patch(`/api/jobs/${job.id}`, { organisation: 'QA Org 2' }, fx.tokens.editor)).status).toBe(200)
    const submit = await api.patch(`/api/jobs/${job.id}`, { reviewStatus: 'in_review' }, fx.tokens.editor)
    expect(submit.status).toBe(200)
    expect(submit.body.doc.reviewStatus).toBe('in_review')
    expect((await api.delete(`/api/jobs/${job.id}`, fx.tokens.editor)).status).toBe(403)
    expect(await rowExists(job.id)).toBe(true)
  })

  it('board: publishes a job and takes it offline by ARCHIVING (the documented route) — row kept, no longer public', async () => {
    const job = await createJob('in_review', fx.tokens.editor)
    expect((await api.patch(`/api/jobs/${job.id}`, { reviewStatus: 'published' }, fx.tokens.board)).status).toBe(200)
    expect((await api.get(`/api/jobs/${job.id}`)).status).toBe(200)
    expect((await api.patch(`/api/jobs/${job.id}`, { reviewStatus: 'archived' }, fx.tokens.board)).status).toBe(200)
    expect((await api.get(`/api/jobs/${job.id}`)).status).toBe(404)
    expect(await rowExists(job.id)).toBe(true)
  })

  it('admin: deletes a published job → row, versions and public page are gone', async () => {
    const job = await createJob('published')
    expect((await jobPage(job.slug)).html).toContain(job.title)
    const res = await api.delete(`/api/jobs/${job.id}`, fx.tokens.admin)
    expect(res.status).toBe(200)
    expect(await rowExists(job.id)).toBe(false)
    const versions = (await queryQaDb(DB, 'SELECT count(*)::int AS n FROM _jobs_v WHERE parent_id = $1', [job.id])).rows[0].n
    expect(versions).toBe(0)
    expect((await api.get(`/api/jobs/${job.id}`)).status).toBe(404)
    writeEvidence('n3-jobs-delete', results)
  })
})
