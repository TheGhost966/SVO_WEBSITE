/**
 * S21 — anonymous access to the Users collection. Found by the independent security review on
 * 2026-10-04; not part of the original audit (QA_AUDIT.md S1–S20), and `users` was never in the
 * role matrix.
 *
 * Cause: `isAdminOrSelf` (src/lib/access.ts) ended in `req.user?.id === id`. On a list or bulk
 * request there is neither a user nor an id, so the comparison was `undefined === undefined` and
 * anonymous callers were granted `read` and `update` on `users`: GET /api/users listed every account
 * (email, role), and a bulk PATCH could overwrite any account's password.
 *
 * Fix: no user → false; admin → true; anyone else → the constraint `id = own id`, which holds for
 * by-id, list and bulk operations alike.
 */
import { describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { queryQaDb } from '../harness/db'
import { writeEvidence } from '../harness/evidence'
import { PASSWORD, uniq, userEmail } from '../harness/seed'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const DB = 'svo_qa_test_p0'
const NON_ADMIN = ['viewer', 'editor', 'board'] as const
const ATTACKER_PASSWORD = 'Attacker-Password-123!'

const nameOf = async (id: number | string) => (await queryQaDb(DB, 'SELECT name FROM users WHERE id = $1', [id])).rows[0]?.name as string | undefined
const loginStatus = async (email: string, password: string) => (await api.post('/api/users/login', { email, password })).status

describe('S21 — anonymous callers cannot read users', () => {
  it.each([
    '/api/users',
    '/api/users?depth=0&limit=100',
    '/api/users?pagination=false',
    '/api/users?where[role][equals]=admin',
    '/api/users?where[email][like]=qa-',
    '/api/users/count',
  ])('REGRESSION S21: GET %s → 403, no account data', async (path) => {
    const res = await api.get(path)
    writeEvidence(`s21-anonymous-${path.replace(/\W+/g, '-')}`, { status: res.status, totalDocs: res.body?.totalDocs, keys: Object.keys(res.body?.docs?.[0] ?? {}) })
    expect(res.status).toBe(403)
    expect(res.text).not.toContain('@test.invalid')
    expect(res.body?.totalDocs).toBeUndefined()
  })

  it('by id as well: GET /api/users/<admin id> → 403', async () => {
    const res = await api.get(`/api/users/${fx.userIds.admin}`)
    expect(res.status).toBe(403)
    expect(res.text).not.toContain(userEmail('admin'))
  })
})

describe('S21 — anonymous callers cannot change users', () => {
  it('REGRESSION S21: an anonymous bulk PATCH cannot set an account’s password (account takeover)', async () => {
    const email = `${uniq('qa-s21-victim')}@test.invalid`
    const created = await api.post('/api/users', { email, password: PASSWORD, name: 'QA S21 victim', role: 'editor' }, fx.tokens.admin)
    expect(created.status).toBe(201)
    const victimId = created.body.doc.id

    const attack = await api.patch(`/api/users?where[id][equals]=${victimId}`, { password: ATTACKER_PASSWORD })
    const after = { attackStatus: attack.status, oldPassword: await loginStatus(email, PASSWORD), attackerPassword: await loginStatus(email, ATTACKER_PASSWORD) }
    writeEvidence('s21-anonymous-password-overwrite', after)
    expect(attack.status).toBe(403)
    expect(after.oldPassword).toBe(200)
    expect(after.attackerPassword).toBe(401)
  })

  it('REGRESSION S21: an anonymous bulk PATCH matching every admin changes nothing', async () => {
    const before = await nameOf(fx.userIds.admin)
    const res = await api.patch('/api/users?where[role][equals]=admin', { name: 'pwned-anonymously', email: 'qa-s21-pwned@test.invalid' })
    expect(res.status).toBe(403)
    expect(await nameOf(fx.userIds.admin)).toBe(before)
    const rows = await queryQaDb(DB, `SELECT count(*)::int AS n FROM users WHERE name = 'pwned-anonymously' OR email = 'qa-s21-pwned@test.invalid'`)
    expect(rows.rows[0].n).toBe(0)
  })

  it('by id as well: anonymous PATCH and DELETE /api/users/<id> → 403', async () => {
    expect((await api.patch(`/api/users/${fx.userIds.viewer}`, { name: 'pwned-by-id' })).status).toBe(403)
    expect((await api.delete(`/api/users/${fx.userIds.viewer}`)).status).toBe(403)
    expect(await nameOf(fx.userIds.viewer)).not.toBe('pwned-by-id')
  })
})

describe('S21 — signed-in non-admins see and change only their own account', () => {
  it.each(NON_ADMIN)('%s: the user list contains exactly their own account', async (role) => {
    const res = await api.get('/api/users?depth=0&limit=100', fx.tokens[role])
    expect(res.status).toBe(200)
    expect(res.body.totalDocs).toBe(1)
    expect(res.body.docs[0].email).toBe(userEmail(role))
    expect(res.text).not.toContain(userEmail('admin'))
  })

  it.each(NON_ADMIN)('%s: cannot read or bulk-update another account', async (role) => {
    const byId = await api.get(`/api/users/${fx.userIds.admin}`, fx.tokens[role])
    expect([403, 404]).toContain(byId.status)
    expect(byId.text).not.toContain(userEmail('admin'))
    const before = await nameOf(fx.userIds.admin)
    await api.patch('/api/users?where[role][equals]=admin', { name: `pwned-by-${role}` }, fx.tokens[role])
    expect(await nameOf(fx.userIds.admin)).toBe(before)
  })

  it.each(NON_ADMIN)('%s: can still read and update their own account, but not their role', async (role) => {
    const id = fx.userIds[role]
    const original = await nameOf(id)
    expect((await api.get(`/api/users/${id}`, fx.tokens[role])).status).toBe(200)
    const renamed = await api.patch(`/api/users/${id}`, { name: `QA ${role} renamed`, role: 'admin' }, fx.tokens[role])
    expect(renamed.status).toBe(200)
    expect(await nameOf(id)).toBe(`QA ${role} renamed`)
    expect((await api.get('/api/users/me', fx.tokens[role])).body?.user?.role).toBe(role)
    // put the fixture back for the other suites
    expect((await api.patch(`/api/users/${id}`, { name: original }, fx.tokens.admin)).status).toBe(200)
  })
})

describe('S21 — administrators keep full access', () => {
  it('admin lists every account and can read and update another user', async () => {
    const list = await api.get('/api/users?depth=0&limit=100', fx.tokens.admin)
    expect(list.status).toBe(200)
    expect(list.body.totalDocs).toBeGreaterThanOrEqual(4)
    const other = await api.get(`/api/users/${fx.userIds.editor}`, fx.tokens.admin)
    expect(other.status).toBe(200)
    expect(other.body.email).toBe(userEmail('editor'))
    const original = await nameOf(fx.userIds.editor)
    expect((await api.patch(`/api/users/${fx.userIds.editor}`, { name: 'QA editor (admin edit)' }, fx.tokens.admin)).status).toBe(200)
    expect((await api.patch(`/api/users/${fx.userIds.editor}`, { name: original }, fx.tokens.admin)).status).toBe(200)
  })
})
