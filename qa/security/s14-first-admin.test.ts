/**
 * S14 — first-user registration.
 *
 * Finding: on an empty `users` table Payload's `POST /api/users/first-register` let any anonymous
 * caller create the first account with a role of their choosing.
 *
 * Fix (src/lib/firstAdmin.ts):
 *  - custom `/first-register` endpoint: production → always 403 pointing at `npm run create-admin`;
 *    non-production → still open, role forced to `admin`;
 *  - `CREATE_ADMIN_ON_BOOT=1` boot flag (what `npm run create-admin` sets): acts only on an empty
 *    `users` table, always creates an admin, never logs the password;
 *  - `beforeDelete` hook: the last remaining administrator cannot be deleted.
 *
 * Throwaway servers on 127.0.0.1 (3101 dev, 3102 production build) on the embedded Postgres.
 */
import { randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startApp, type RunningApp } from '../harness/app'
import { cloneTemplate, queryQaDb } from '../harness/db'
import { qaDatabaseUri } from '../harness/safety'
import { Api } from '../harness/api'
import { PASSWORD } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'
import { S3_PORT } from '../harness/globalSetupS3'
import { ensureProdBuild, prodEnv, PROD_PORT } from '../harness/prodBuild'

const evidence: Record<string, unknown> = {}
afterAll(() => {
  writeEvidence('s14-first-admin', evidence)
})

const users = async (db: string) => (await queryQaDb(db, 'SELECT email, role FROM users ORDER BY id')).rows as { email: string; role: string }[]
const adminCount = async (db: string) => (await users(db)).filter((u) => u.role === 'admin').length

describe('S14 — non-production (next dev, NODE_ENV=test): first-register stays open, role forced to admin', () => {
  const DB = 'svo_qa_test_s14_dev'
  let app: RunningApp
  let api: Api
  let token: string
  let adminId: string | number

  const createUser = async (email: string, role: string) => {
    const res = await api.post('/api/users', { email, password: PASSWORD, name: `QA ${role}`, role }, token)
    expect(res.status).toBe(201)
    return res.body.doc.id as string | number
  }

  beforeAll(async () => {
    await cloneTemplate(DB)
    app = await startApp({ name: 's14-dev', port: S3_PORT, env: { DATABASE_URI: qaDatabaseUri(DB) } })
    api = new Api(app.baseUrl)
  })

  afterAll(async () => {
    await app?.stop()
  })

  it('REGRESSION S14: the caller-chosen role is ignored — first-register with role=viewer creates an admin', async () => {
    const res = await api.post('/api/users/first-register', { email: 'qa-s14-first@test.invalid', password: PASSWORD, name: 'QA first', role: 'viewer' })
    evidence.devFirstRegister = { status: res.status, role: res.body?.user?.role, setsCookie: Boolean(res.headers.get('set-cookie')) }
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('admin')
    expect(res.headers.get('set-cookie')).toMatch(/payload-token=/)
    expect(await users(DB)).toEqual([{ email: 'qa-s14-first@test.invalid', role: 'admin' }])
    token = res.body.token
    const me = await api.get('/api/users/me', token)
    expect(me.body?.user?.role).toBe('admin')
    adminId = me.body.user.id
  })

  it('a second first-register is refused and creates nothing', async () => {
    const res = await api.post('/api/users/first-register', { email: 'qa-s14-second@test.invalid', password: PASSWORD, name: 'QA second', role: 'admin' })
    expect(res.status).toBe(403)
    expect(await users(DB)).toHaveLength(1)
  })

  it('REGRESSION S14: the only administrator cannot delete their own account', async () => {
    const res = await api.delete(`/api/users/${adminId}`, token)
    evidence.lastAdminDelete = { status: res.status, message: res.body?.errors?.[0]?.message }
    expect(res.status).toBe(403)
    expect(res.body.errors[0].message).toMatch(/last remaining administrator/i)
    expect(await adminCount(DB)).toBe(1)
    expect((await api.get('/api/users/me', token)).body?.user?.role).toBe('admin')
  })

  it('REGRESSION S14: a bulk delete matching every admin leaves the last one in place', async () => {
    const res = await api.delete('/api/users?where[role][equals]=admin', token)
    evidence.lastAdminBulkDelete = { status: res.status, deleted: res.body?.docs?.length, errors: res.body?.errors }
    expect(res.body?.docs ?? []).toHaveLength(0)
    expect(JSON.stringify(res.body?.errors ?? [])).toMatch(/last remaining administrator/i)
    expect(await adminCount(DB)).toBe(1)
  })

  it('with two admins one can be deleted; the one left over cannot', async () => {
    const secondId = await createUser('qa-s14-admin2@test.invalid', 'admin')
    expect(await adminCount(DB)).toBe(2)
    expect((await api.delete(`/api/users/${secondId}`, token)).status).toBe(200)
    expect(await adminCount(DB)).toBe(1)
    expect((await api.delete(`/api/users/${adminId}`, token)).status).toBe(403)
    expect(await adminCount(DB)).toBe(1)
  })

  it('REGRESSION S14: deleting two admins in ONE bulk request never leaves zero admins', async () => {
    await createUser('qa-s14-admin3@test.invalid', 'admin')
    expect(await adminCount(DB)).toBe(2)
    const res = await api.delete('/api/users?where[role][equals]=admin', token)
    evidence.twoAdminBulkDelete = { status: res.status, deleted: res.body?.docs?.length, errors: res.body?.errors?.length }
    expect(await adminCount(DB)).toBeGreaterThanOrEqual(1)
  })

  it('other accounts are unaffected: an admin can still delete an editor', async () => {
    // The previous test may have deleted the admin this token belongs to — sign in as whoever is left.
    const [survivor] = (await users(DB)).filter((u) => u.role === 'admin')
    token = await api.login(survivor.email, PASSWORD)
    const editorId = await createUser('qa-s14-editor@test.invalid', 'editor')
    expect((await api.delete(`/api/users/${editorId}`, token)).status).toBe(200)
    expect((await users(DB)).map((u) => u.email)).not.toContain('qa-s14-editor@test.invalid')
  })
})

describe('S14 — production (next build + next start, NODE_ENV=production)', () => {
  const DB = 'svo_qa_test_s14_prod'
  const secret = randomBytes(32).toString('hex')
  const ADMIN_EMAIL = 'qa-s14-prod-admin@test.invalid'
  // Generated per run and unlike anything the server prints, so "not in the log" is meaningful.
  const ADMIN_PASSWORD = `Pw-${randomBytes(12).toString('hex')}`
  const WEAK_PASSWORD = `w${randomBytes(4).toString('hex')}`
  const createAdminEnv = (email: string, password: string) =>
    prodEnv(DB, secret, { CREATE_ADMIN_ON_BOOT: '1', CREATE_ADMIN_EMAIL: email, CREATE_ADMIN_PASSWORD: password, CREATE_ADMIN_NAME: 'QA Prod Admin' })
  const firstRegister = (api: Api, n: number | string) =>
    api.post('/api/users/first-register', { email: `qa-s14-attacker-${n}@test.invalid`, password: PASSWORD, name: 'attacker', role: 'admin' })

  beforeAll(async () => {
    await cloneTemplate(DB)
    evidence.prodBuild = await ensureProdBuild()
  })

  describe('empty users table, no boot flag', () => {
    let app: RunningApp
    let api: Api

    beforeAll(async () => {
      app = await startApp({ name: 's14-prod-empty', port: PROD_PORT, command: 'start', env: prodEnv(DB, secret) })
      api = new Api(app.baseUrl)
    })
    afterAll(async () => {
      await app?.stop()
    })

    it('the database really is empty and the server is up', async () => {
      const init = await api.get('/api/users/init')
      expect(init.status).toBe(200)
      expect(init.body).toEqual({ initialized: false })
      expect(await users(DB)).toEqual([])
    })

    it('REGRESSION S14: anonymous first-register → 403 pointing at `npm run create-admin`; no user, no token', async () => {
      const res = await firstRegister(api, 'single')
      evidence.prodFirstRegister = { status: res.status, body: res.body, setsCookie: Boolean(res.headers.get('set-cookie')) }
      expect(res.status).toBe(403)
      expect(res.body.errors[0].message).toContain('npm run create-admin')
      expect(res.text).not.toMatch(/token/i)
      expect(res.headers.get('set-cookie')).toBeNull()
      expect(await users(DB)).toEqual([])
    })

    it('REGRESSION S14: the admin panel’s own form encoding (multipart `_payload`) is refused the same way', async () => {
      const form = new FormData()
      form.append('_payload', JSON.stringify({ email: 'qa-s14-attacker-form@test.invalid', password: PASSWORD, 'confirm-password': PASSWORD, name: 'attacker', role: 'admin' }))
      const res = await api.request('POST', '/api/users/first-register', { form })
      expect(res.status).toBe(403)
      expect(await users(DB)).toEqual([])
    })

    it('REGRESSION S14: 6 concurrent first-register calls → six 403s, 0 users', async () => {
      const results = await Promise.all(Array.from({ length: 6 }, (_, i) => firstRegister(api, i)))
      evidence.prodRace = { statuses: results.map((r) => r.status), usersAfter: (await users(DB)).length }
      expect(results.map((r) => r.status)).toEqual([403, 403, 403, 403, 403, 403])
      for (const r of results) expect(r.text).not.toMatch(/token/i)
      expect(await users(DB)).toEqual([])
    })

    it('the plain create route is no way around it: anonymous POST /api/users → 403, 0 users', async () => {
      const res = await api.post('/api/users', { email: 'qa-s14-attacker-create@test.invalid', password: PASSWORD, name: 'attacker', role: 'admin' })
      expect(res.status).toBe(403)
      expect(await users(DB)).toEqual([])
    })
  })

  describe('CREATE_ADMIN_ON_BOOT (what `npm run create-admin` sets)', () => {
    it('a too-short password → "failed", nothing created, the password is not in the server log', async () => {
      const app = await startApp({
        name: 's14-prod-create-admin-weak',
        port: PROD_PORT,
        command: 'start',
        env: createAdminEnv(ADMIN_EMAIL, WEAK_PASSWORD),
        waitForLog: /\[create-admin\] (created|skipped|failed)/,
      })
      try {
        evidence.createAdminWeak = { line: app.output().match(/\[create-admin\][^\n]*/)?.[0] }
        expect(app.output()).toMatch(/\[create-admin\] failed: CREATE_ADMIN_PASSWORD must be at least 12 characters/)
        expect(app.output()).not.toContain(WEAK_PASSWORD)
        expect(await users(DB)).toEqual([])
      } finally {
        await app.stop()
      }
    })

    it('REGRESSION S14: empty users → creates exactly one admin, who can sign in; the password never reaches the log', async () => {
      const app = await startApp({
        name: 's14-prod-create-admin',
        port: PROD_PORT,
        command: 'start',
        env: createAdminEnv(ADMIN_EMAIL, ADMIN_PASSWORD),
        waitForLog: /\[create-admin\] (created|skipped|failed)/,
      })
      try {
        const api = new Api(app.baseUrl)
        expect(app.output()).toContain(`[create-admin] created administrator ${ADMIN_EMAIL}`)
        expect(await users(DB)).toEqual([{ email: ADMIN_EMAIL, role: 'admin' }])
        const token = await api.login(ADMIN_EMAIL, ADMIN_PASSWORD)
        expect((await api.get('/api/users/me', token)).body?.user?.role).toBe('admin')
        // Still closed once a user exists — production never registers over HTTP.
        const again = await firstRegister(api, 'after-create')
        expect(again.status).toBe(403)
        expect(again.body.errors[0].message).toContain('npm run create-admin')
        evidence.createAdmin = { line: app.output().match(/\[create-admin\][^\n]*/)?.[0], passwordInLog: app.output().includes(ADMIN_PASSWORD) }
        expect(app.output()).not.toContain(ADMIN_PASSWORD)
        expect(await users(DB)).toHaveLength(1)
      } finally {
        await app.stop()
      }
    })

    it('REGRESSION S14: users not empty → "skipped", no second account, the existing admin is untouched', async () => {
      const otherPassword = `Pw-${randomBytes(12).toString('hex')}`
      const app = await startApp({
        name: 's14-prod-create-admin-again',
        port: PROD_PORT,
        command: 'start',
        env: createAdminEnv('qa-s14-prod-second@test.invalid', otherPassword),
        waitForLog: /\[create-admin\] (created|skipped|failed)/,
      })
      try {
        const api = new Api(app.baseUrl)
        evidence.createAdminAgain = { line: app.output().match(/\[create-admin\][^\n]*/)?.[0] }
        expect(app.output()).toMatch(/\[create-admin\] skipped: the users table is not empty \(1 account/)
        expect(app.output()).not.toContain(otherPassword)
        expect(await users(DB)).toEqual([{ email: ADMIN_EMAIL, role: 'admin' }])
        // The original password still works; the one offered on this boot was never stored.
        expect(await api.login(ADMIN_EMAIL, ADMIN_PASSWORD)).toBeTruthy()
        const wrong = await api.post('/api/users/login', { email: ADMIN_EMAIL, password: otherPassword })
        expect(wrong.status).toBe(401)
      } finally {
        await app.stop()
      }
    })
  })
})
