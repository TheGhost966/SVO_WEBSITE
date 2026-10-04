/**
 * Manual QA stack — the app as a PRODUCTION build (`next build` + `next start`) on the disposable
 * embedded Postgres, with the local SMTP sink, the project's seed content and one user per role.
 * For clicking through /admin and the public site in a real browser; revalidation only behaves
 * realistically in a production build.
 *
 *   npm run stack -- up              build and start; keeps the database of the previous run
 *   npm run stack -- up --fresh      start from an empty, freshly migrated and seeded database
 *   npm run stack -- up --no-build   reuse the previous build (only if no source file changed)
 *   npm run stack -- down            stop it (also cleans up after a killed `up`)
 *   npm run stack -- status
 *
 * Same isolation as the test suites: every process gets its environment from harness/app.ts
 * (`.env.local` is never read), harness/safety.ts refuses any database that is not this local one,
 * and mail goes to the sink (qa/.tmp/mail.jsonl) — nothing leaves the machine. It has its own
 * Postgres data directory (qa/.tmp/pg-stack) so the database survives a restart, but it shares the
 * Postgres port with the suites: stop the stack before running `npm run test:*`.
 */
import path from 'node:path'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:net'
import EmbeddedPostgres from 'embedded-postgres'
import { Api } from './harness/api'
import { buildApp, distDirFor, removeDistDir, startApp, type AppEnv, type RunningApp } from './harness/app'
import { buildTemplateDatabase, verifyTemplateMigrations, TEMPLATE_DB } from './harness/migrate'
import { APP_ROOT, LOG_DIR, TMP_DIR } from './harness/paths'
import { createDatabase } from './harness/postgres'
import { snapshotRepoFiles } from './harness/repoFiles'
import { QA_PG_PASSWORD, QA_PG_PORT, QA_PG_USER, qaDatabaseUri } from './harness/safety'
import { PASSWORD, ROLES, userEmail } from './harness/seed'
import { MAIL_LOG, SMTP_SINK_PORT, startSmtpSink } from './harness/smtpSink'

const PORT = 3100
const DB = 'svo_qa_stack'
const PG_DIR = path.join(TMP_DIR, 'pg-stack')
const STATE_FILE = path.join(TMP_DIR, 'stack.json')
const STOP_FILE = path.join(TMP_DIR, 'stack.stop')
const DIST = distDirFor('stack')
/** Fixed, so sessions survive a restart. Used by this throwaway stack only. */
const SECRET = 'qa-stack-only-secret-0123456789-abcdefghijklmnopqrstuvwxyz'
const BASE_URL = `http://127.0.0.1:${PORT}`

const log = (msg: string) => console.log(`[stack ${new Date().toISOString().slice(11, 19)}] ${msg}`)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** `next build` / `next start` environment; `__NEXT_PROCESSED_ENV` makes Next skip every .env* file. */
const prodEnv = (): AppEnv => ({
  NODE_ENV: 'production',
  __NEXT_PROCESSED_ENV: 'true',
  NEXT_DIST_DIR: DIST,
  DATABASE_URI: qaDatabaseUri(DB),
  PAYLOAD_SECRET: SECRET,
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: String(SMTP_SINK_PORT),
})

// ─── Ports ────────────────────────────────────────────────────────────────────

function listeners(port: number): number[] {
  if (process.platform !== 'win32') return []
  try {
    const out = execSync('netstat -ano -p TCP', { encoding: 'utf8' })
    const pids = out
      .split('\n')
      .filter((l) => l.includes('LISTENING') && new RegExp(`:${port}\\s`).test(l))
      .map((l) => Number(l.trim().split(/\s+/).pop()))
      .filter((pid) => pid > 0)
    return [...new Set(pids)]
  } catch {
    return []
  }
}

function killListeners(ports: number[]) {
  for (const port of ports) {
    for (const pid of listeners(port)) {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' })
        log(`killed process ${pid} (was listening on ${port})`)
      } catch {
        // already gone
      }
    }
  }
}

const PORTS = [PORT, SMTP_SINK_PORT, QA_PG_PORT]

// ─── Users ────────────────────────────────────────────────────────────────────

/** One account per role, over REST against a non-production boot (first-register is open there). */
async function createRoleUsers(api: Api) {
  const first = await api.post('/api/users/first-register', { email: userEmail('admin'), password: PASSWORD, name: 'QA Admin' })
  if (first.status >= 300) throw new Error(`first-register failed: ${first.status} ${first.text.slice(0, 300)}`)
  const admin = await api.login(userEmail('admin'), PASSWORD)
  for (const role of ROLES.filter((r) => r !== 'admin')) {
    const res = await api.post('/api/users', { email: userEmail(role), password: PASSWORD, name: `QA ${role[0].toUpperCase()}${role.slice(1)}`, role }, admin)
    if (res.status >= 300) throw new Error(`create user ${role} failed: ${res.status} ${res.text.slice(0, 300)}`)
  }
}

// ─── up ───────────────────────────────────────────────────────────────────────

async function up(flags: Set<string>) {
  const busy = PORTS.filter((p) => listeners(p).length > 0)
  if (busy.length) throw new Error(`port(s) ${busy.join(', ')} already in use — run \`npm run stack -- down\` first (or stop the test suite)`)

  mkdirSync(TMP_DIR, { recursive: true })
  rmSync(STOP_FILE, { force: true })
  const restoreRepoFiles = snapshotRepoFiles()

  const fresh = flags.has('--fresh') || !existsSync(path.join(PG_DIR, 'PG_VERSION'))
  if (fresh) rmSync(PG_DIR, { recursive: true, force: true })
  const pg = new EmbeddedPostgres({
    databaseDir: PG_DIR,
    user: QA_PG_USER,
    password: QA_PG_PASSWORD,
    port: QA_PG_PORT,
    persistent: true,
    initdbFlags: ['--encoding=UTF8'],
    onLog: () => {},
  })
  let smtp: Server | undefined
  let app: RunningApp | undefined
  let stopping = false
  const shutdown = async () => {
    if (stopping) return
    stopping = true
    log('stopping…')
    await app?.stop().catch(() => {})
    await new Promise((r) => (smtp ? smtp.close(r) : r(undefined)))
    await pg.stop().catch(() => {})
    restoreRepoFiles()
    rmSync(STATE_FILE, { force: true })
    rmSync(STOP_FILE, { force: true })
    log('stopped')
  }
  for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => void shutdown().then(() => process.exit(0)))

  try {
    if (fresh) await pg.initialise()
    await pg.start()

    if (fresh) {
      log('migrating an empty database from migrations/ …')
      await buildTemplateDatabase(pg, PORT)
      const migrations = await verifyTemplateMigrations(pg)
      await createDatabase(pg, DB, TEMPLATE_DB)
      log(`${migrations.onDisk.length} migrations applied`)

      log('seeding (npm run seed content) and creating one user per role …')
      const seedApp = await startApp({
        name: 'stack-seed',
        port: PORT,
        env: { DATABASE_URI: qaDatabaseUri(DB), SEED_ON_BOOT: '1' },
        waitForLog: /\[seed\] (complete|failed)/,
      })
      try {
        if (/\[seed\] failed/.test(seedApp.output())) throw new Error(`seed failed:\n${seedApp.output().slice(-3000)}`)
        await createRoleUsers(new Api(seedApp.baseUrl))
      } finally {
        await seedApp.stop()
      }
    } else {
      log('reusing the database of the previous run (use --fresh for a new one)')
    }

    smtp = await startSmtpSink()

    if (flags.has('--no-build') && existsSync(path.join(APP_ROOT, DIST, 'BUILD_ID'))) {
      log('reusing the previous production build (--no-build)')
    } else {
      log('next build (production) …')
      removeDistDir(DIST)
      const build = await buildApp('stack-build', PORT, prodEnv())
      if (build.code !== 0) throw new Error(`next build failed (${build.code}):\n${build.output.slice(-4000)}`)
    }

    log('next start …')
    // Not named after its dist dir, so stopping the server keeps the build for `--no-build`.
    app = await startApp({ name: 'stack-app', command: 'start', port: PORT, env: prodEnv() })

    const state = {
      pid: process.pid,
      startedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      admin: `${BASE_URL}/admin`,
      database: qaDatabaseUri(DB),
      mailLog: MAIL_LOG,
      serverLog: path.join(LOG_DIR, 'stack-app.log'),
      users: Object.fromEntries(ROLES.map((r) => [r, userEmail(r)])),
      password: PASSWORD,
    }
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    log(`READY  ${state.admin}`)
    log(`users  ${ROLES.map((r) => userEmail(r)).join(', ')}  password: ${PASSWORD}`)
    log(`mail   ${MAIL_LOG}`)
    log(`log    ${state.serverLog}`)
    log('stop with: npm run stack -- down')

    while (!existsSync(STOP_FILE) && !stopping) await sleep(1000)
  } finally {
    await shutdown()
  }
}

// ─── down / status ────────────────────────────────────────────────────────────

async function down() {
  if (existsSync(STATE_FILE)) {
    writeFileSync(STOP_FILE, new Date().toISOString())
    for (let i = 0; i < 60 && existsSync(STATE_FILE); i++) await sleep(1000)
  }
  // A killed `up` never ran its shutdown: take down whatever still holds the ports.
  await sleep(500)
  killListeners(PORTS)
  rmSync(STATE_FILE, { force: true })
  rmSync(STOP_FILE, { force: true })
  rmSync(path.join(PG_DIR, 'postmaster.pid'), { force: true })
  snapshotRepoFiles() // strips the harness entries a killed run left in tsconfig.json / next-env.d.ts
  log('down')
}

function status() {
  const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : null
  console.log(JSON.stringify({ running: Boolean(state), state, listening: Object.fromEntries(PORTS.map((p) => [p, listeners(p)])) }, null, 2))
}

const [command, ...rest] = process.argv.slice(2)
const flags = new Set(rest)
const run = command === 'up' ? up(flags) : command === 'down' ? down() : command === 'status' ? Promise.resolve(status()) : Promise.reject(new Error('usage: npm run stack -- up [--fresh] [--no-build] | down | status'))
run.then(
  () => process.exit(0),
  (err) => {
    console.error(`[stack] ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  },
)
