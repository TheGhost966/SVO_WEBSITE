/**
 * S3 — PAYLOAD_SECRET fallback.
 *
 * Fix: src/lib/payloadSecret.ts `resolvePayloadSecret()` — in production a missing / short /
 * known-placeholder secret throws (called from payload.config.ts and, at boot, from
 * instrumentation.node.ts); outside production an unset secret still falls back to a dev-only value.
 *
 * History: the two static "REPRODUCES S3" tests (QA_FINDINGS_P0.md) are inverted below. The runtime
 * block under NODE_ENV=test keeps its assertions unchanged — it now documents the intended
 * non-production fallback — and a production block (real `next build` + `next start`) is added.
 *
 * Everything runs against throwaway servers on 127.0.0.1 (3101 dev, 3102 production) backed by the
 * embedded Postgres. Tokens are only minted for QA users inside those databases. The production
 * secret is generated per run and asserted never to appear in server output.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp, startApp, startAppExpectingFailure, type RunningApp } from '../harness/app'
import { cloneTemplate, queryQaDb } from '../harness/db'
import { qaDatabaseUri } from '../harness/safety'
import { Api } from '../harness/api'
import { PASSWORD, userEmail } from '../harness/seed'
import { decode, payloadKey, randomUUID, signHS256, verifiesWith } from '../harness/jwt'
import { writeEvidence } from '../harness/evidence'
import { APP_ROOT } from '../harness/paths'
import { S3_PORT } from '../harness/globalSetupS3'
import { DEV_ONLY_FALLBACK_SECRET, MIN_PRODUCTION_SECRET_LENGTH, resolvePayloadSecret } from '../../src/lib/payloadSecret'

const FALLBACK = 'INSECURE_DEV_SECRET_REPLACE_ME'
const ENV_EXAMPLE_PLACEHOLDER = 'replace-with-a-long-random-secret-min-32-chars'
const evidence: Record<string, unknown> = {}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

afterAll(() => {
  writeEvidence('s3-payload-secret', evidence)
})

describe('S3 — static: how the secret is configured', () => {
  it('REGRESSION S3: payload.config.ts no longer substitutes a constant — it calls resolvePayloadSecret()', () => {
    const src = readFileSync(path.join(APP_ROOT, 'src/payload.config.ts'), 'utf8')
    expect(src).not.toMatch(/PAYLOAD_SECRET\s*\?\?/)
    expect(src).not.toContain(`'${FALLBACK}'`)
    expect(src).toContain('secret: resolvePayloadSecret()')
  })

  it('REGRESSION S3: the only PAYLOAD_SECRET read is the NODE_ENV-gated resolver, and instrumentation calls it at boot', () => {
    const hits = walk(path.join(APP_ROOT, 'src'))
      .filter((f) => /\.(ts|tsx|js|mjs)$/.test(f))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((line, i) => ({ file: path.relative(APP_ROOT, f).replace(/\\/g, '/'), line: i + 1, text: line.trim() }))
          .filter((l) => /env\.PAYLOAD_SECRET/.test(l.text)),
      )
    evidence.staticReferences = hits
    expect([...new Set(hits.map((h) => h.file))]).toEqual(['src/lib/payloadSecret.ts'])
    expect(readFileSync(path.join(APP_ROOT, 'src/lib/payloadSecret.ts'), 'utf8')).toMatch(/NODE_ENV !== 'production'/)
    expect(readFileSync(path.join(APP_ROOT, 'src/instrumentation.node.ts'), 'utf8')).toContain('resolvePayloadSecret()')
  })
})

describe('S3 — resolvePayloadSecret() unit behaviour', () => {
  it.each([
    ['missing', undefined, /is not set/],
    ['empty string', '', /is not set/],
    ['the dev-only fallback constant', DEV_ONLY_FALLBACK_SECRET, /known placeholder/],
    ['the .env.example placeholder', ENV_EXAMPLE_PLACEHOLDER, /known placeholder/],
    ['31 characters', 'b'.repeat(MIN_PRODUCTION_SECRET_LENGTH - 1), /shorter than 32/],
  ])('REGRESSION S3: production + %s → throws', (_label, secret, message) => {
    expect(() => resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: secret })).toThrow(message)
  })

  it('production + a valid secret → returned unchanged', () => {
    const good = 'a'.repeat(MIN_PRODUCTION_SECRET_LENGTH)
    expect(resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: good })).toBe(good)
  })

  it('error messages never contain the secret value', () => {
    const secret = 'short-but-secret-value-123'
    let message = ''
    try {
      resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: secret })
    } catch (err) {
      message = (err as Error).message
    }
    expect(message).toMatch(/shorter than/)
    expect(message).not.toContain(secret)
  })

  it.each(['development', 'test', undefined])('non-production (NODE_ENV=%s): unset → dev-only fallback, set → used as is', (nodeEnv) => {
    expect(resolvePayloadSecret({ NODE_ENV: nodeEnv })).toBe(DEV_ONLY_FALLBACK_SECRET)
    expect(resolvePayloadSecret({ NODE_ENV: nodeEnv, PAYLOAD_SECRET: 'x' })).toBe('x')
  })
})

describe('S3 — non-production runtime (next dev, NODE_ENV=test) with PAYLOAD_SECRET unset: dev-only fallback, by design', () => {
  let app: RunningApp
  let api: Api
  let token: string
  let claims: Record<string, unknown>
  const fallbackKey = payloadKey(FALLBACK)
  const me = async (t: string) => (await api.get('/api/users/me', t)).body?.user ?? null

  beforeAll(async () => {
    await cloneTemplate('svo_qa_test_s3_unset')
    app = await startApp({
      name: 's3-secret-unset',
      port: S3_PORT,
      env: { DATABASE_URI: qaDatabaseUri('svo_qa_test_s3_unset'), PAYLOAD_SECRET: undefined },
    })
    api = new Api(app.baseUrl)
    const reg = await api.post('/api/users/first-register', { email: userEmail('admin'), password: PASSWORD, name: 'QA Admin', role: 'admin' })
    expect(reg.status).toBeLessThan(300)
    token = await api.login(userEmail('admin'), PASSWORD)
    claims = decode(token).claims
    const editor = await api.post('/api/users', { email: userEmail('editor'), password: PASSWORD, name: 'QA editor', role: 'editor' }, token)
    expect(editor.status).toBe(201)
    claims.__editorId = editor.body.doc.id
  })

  afterAll(async () => {
    await app?.stop()
  })

  it('development stays usable: the server starts and serves requests with no secret configured', async () => {
    const res = await api.get('/api/users/init')
    evidence.unsetStartup = { initStatus: res.status, body: res.body }
    expect(res.status).toBe(200)
  })

  it('non-production: tokens are signed with the dev-only fallback secret', () => {
    evidence.issuedTokenClaims = { ...claims, __editorId: undefined }
    expect(verifiesWith(token, fallbackKey)).toBe(true)
    expect(verifiesWith(token, payloadKey('some-other-secret'))).toBe(false)
  })

  it('non-production: a token forged with the dev fallback + a known session id is accepted (why it must never reach production)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const forged = signHS256({ id: claims.id, collection: 'users', email: claims.email, sid: claims.sid, iat: now, exp: now + 10 * 365 * 24 * 3600 }, fallbackKey)
    const user = await me(forged)
    evidence.forgedWithKnownSid = { accepted: Boolean(user), role: user?.role, exp: decode(forged).claims.exp }
    expect(user?.email).toBe(userEmail('admin'))
    expect(user?.role).toBe('admin')
  })

  it('mitigation observed: forged tokens WITHOUT a valid session id are rejected (Payload useSessions=true)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const base = { id: claims.id, collection: 'users', email: claims.email, iat: now, exp: now + 3600 }
    const results = {
      noSid: await me(signHS256(base, fallbackKey)),
      randomSid: await me(signHS256({ ...base, sid: randomUUID() }, fallbackKey)),
      otherUserWithAdminSid: await me(signHS256({ ...base, id: claims.__editorId, sid: claims.sid }, fallbackKey)),
      wrongKey: await me(signHS256({ ...base, sid: claims.sid }, payloadKey('not-the-secret'))),
    }
    evidence.forgedWithoutValidSession = Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v ? 'ACCEPTED' : 'rejected']))
    for (const [k, v] of Object.entries(results)) expect(v, k).toBeNull()
  })

  it('non-production (N1, still open): a session that has EXPIRED but not been pruned still validates a forged token', async () => {
    // Payload prunes expired sessions only on the user's next login (payload/dist/auth/sessions.js),
    // and the JWT strategy checks that `sid` exists, not that it is unexpired. Simulated by
    // back-dating the session row in the disposable database.
    const updated = await queryQaDb('svo_qa_test_s3_unset', `UPDATE users_sessions SET expires_at = now() - interval '30 days' WHERE id = $1`, [claims.sid])
    expect(updated.rowCount).toBe(1)
    const now = Math.floor(Date.now() / 1000)
    const forged = signHS256({ id: claims.id, collection: 'users', email: claims.email, sid: claims.sid, iat: now, exp: now + 3600 }, fallbackKey)
    const legitAfterExpiry = await me(token)
    const user = await me(forged)
    evidence.expiredSession = { forgedAccepted: Boolean(user), legitTokenStillAccepted: Boolean(legitAfterExpiry) }
    expect(user?.role).toBe('admin')
  })

  it('mitigation observed: after logout the session is gone and the forged long-lived token stops working', async () => {
    const now = Math.floor(Date.now() / 1000)
    const forged = signHS256({ id: claims.id, collection: 'users', email: claims.email, sid: claims.sid, iat: now, exp: now + 3600 }, fallbackKey)
    const logout = await api.request('POST', '/api/users/logout', { token })
    const after = await me(forged)
    evidence.afterLogout = { logoutStatus: logout.status, forgedAccepted: Boolean(after) }
    expect(logout.status).toBe(200)
    expect(after).toBeNull()
  })
})

describe('S3 — non-production runtime with PAYLOAD_SECRET set to an empty string', () => {
  it('non-production: "" is kept (only unset falls back) and Payload refuses it with "missing secret key"', async () => {
    await cloneTemplate('svo_qa_test_s3_empty')
    const app = await startApp({
      name: 's3-secret-empty',
      port: S3_PORT,
      env: { DATABASE_URI: qaDatabaseUri('svo_qa_test_s3_empty'), PAYLOAD_SECRET: '' },
      acceptAnyStatus: true,
    })
    try {
      const api = new Api(app.baseUrl)
      const res = await api.get('/api/users/init')
      const missingSecretLogged = /missing secret key/i.test(app.output())
      evidence.emptySecret = { initStatus: res.status, missingSecretLogged }
      expect(res.status).toBe(500)
      expect(missingSecretLogged).toBe(true)
    } finally {
      await app.stop()
    }
  })
})

/**
 * Production: one real `next build` (NODE_ENV=production, valid generated secret, output in
 * .next/qa-prod), then `next start` once per secret variant. `__NEXT_PROCESSED_ENV=true` makes Next
 * skip every .env* file, so "missing" really means missing — .env.local can't fill it in.
 */
describe('S3 — production (next build + next start, NODE_ENV=production)', () => {
  const PROD_PORT = S3_PORT + 1
  const DB = 'svo_qa_test_s3_prod'
  const validSecret = randomBytes(32).toString('hex')
  const prodEnv = (secret: string | undefined) => ({
    NODE_ENV: 'production',
    __NEXT_PROCESSED_ENV: 'true',
    NEXT_DIST_DIR: '.next/qa-prod',
    DATABASE_URI: qaDatabaseUri(DB),
    PAYLOAD_SECRET: secret,
  })
  const redact = (s: string) => s.split(validSecret).join('<valid-secret>')
  const failures: Record<string, unknown> = {}

  beforeAll(async () => {
    await cloneTemplate(DB)
    const build = await buildApp('s3-prod-build', PROD_PORT, prodEnv(validSecret))
    evidence.prodBuild = { exitCode: build.code, secretInOutput: build.output.includes(validSecret) }
    if (build.code !== 0) throw new Error(`next build failed (${build.code}):\n${redact(build.output).slice(-3000)}`)
  })

  afterAll(() => {
    evidence.prodFailures = failures
  })

  it('REGRESSION S3: production + valid PAYLOAD_SECRET → starts, serves, signs sessions with that secret, never logs it', async () => {
    const app = await startApp({ name: 's3-prod-valid', port: PROD_PORT, command: 'start', env: prodEnv(validSecret) })
    try {
      const api = new Api(app.baseUrl)
      expect((await api.get('/api/users/init')).status).toBe(200)
      const reg = await api.post('/api/users/first-register', { email: userEmail('admin'), password: PASSWORD, name: 'QA Admin', role: 'admin' })
      expect(reg.status).toBeLessThan(300)
      const token = await api.login(userEmail('admin'), PASSWORD)
      expect((await api.get('/api/users/me', token)).body?.user?.role).toBe('admin')
      expect(verifiesWith(token, payloadKey(validSecret))).toBe(true)
      expect(verifiesWith(token, payloadKey(FALLBACK))).toBe(false)
      evidence.prodValid = { started: true, tokenSignedWithConfiguredSecret: true, secretInOutput: app.output().includes(validSecret) }
      expect(app.output()).not.toContain(validSecret)
    } finally {
      await app.stop()
    }
  })

  it.each([
    ['missing', undefined, /PAYLOAD_SECRET is not set/],
    ['empty string', '', /PAYLOAD_SECRET is not set/],
    ['the old hard-coded fallback constant', FALLBACK, /known placeholder/],
    ['the .env.example placeholder', ENV_EXAMPLE_PLACEHOLDER, /known placeholder/],
    ['too short (31 chars)', 'c'.repeat(31), /shorter than 32/],
  ])('REGRESSION S3: production + %s PAYLOAD_SECRET → never serves, logs a clear message', async (label, secret, message) => {
    const r = await startAppExpectingFailure({ name: `s3-prod-${label.replace(/\W+/g, '-')}`, port: PROD_PORT, command: 'start', env: prodEnv(secret) })
    failures[label] = { exited: r.exited, exitCode: r.exitCode, statuses: r.statuses, messageLogged: message.test(r.output) }
    expect(r.served200, `served 200 with ${label} secret`).toBe(false)
    expect(r.output).toMatch(message)
  })
})
