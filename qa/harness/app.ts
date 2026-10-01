import path from 'node:path'
import { spawn, execSync, type ChildProcess } from 'node:child_process'
import { createWriteStream, mkdirSync } from 'node:fs'
import { APP_ROOT, LOG_DIR } from './paths'
import { assertSafeDatabaseUri } from './safety'

/**
 * Every env var the app reads (see .env.example / QA_AUDIT.md §2). All of them are removed from the
 * inherited environment and then set explicitly, so nothing from the developer's shell leaks in.
 */
const APP_ENV_KEYS = [
  'DATABASE_URI',
  'PAYLOAD_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'BOARD_NOTIFICATION_EMAIL',
  'CONTACT_FORWARD_EMAIL',
  'BLOB_READ_WRITE_TOKEN',
  'PAYLOAD_MIGRATE_STATUS',
  'PAYLOAD_MIGRATE_ON_BOOT',
  'PAYLOAD_MIGRATE_CREATE_NAME',
  'PAYLOAD_MIGRATE_BASELINE',
  'PAYLOAD_MIGRATING',
  'SEED_ON_BOOT',
  'NODE_ENV',
  'NEXT_DIST_DIR',
  '__NEXT_PROCESSED_ENV',
]

export type AppEnv = Record<string, string | undefined>

/**
 * NODE_ENV=test is load-bearing: @next/env skips `.env.local` in test mode
 * (node_modules/@next/env: `d!=="test"&&".env.local"`), so the real Neon URL and SMTP credentials
 * in .env.local are never loaded into the app under test. The explicit values below are a second,
 * independent layer — process env always wins over dotenv files.
 *
 * SMTP points at 127.0.0.1:1 (nothing listens there): sends fail fast with ECONNREFUSED, which the
 * app logs and swallows. No email can leave this machine.
 */
export function buildAppEnv(port: number, overrides: AppEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const key of APP_ENV_KEYS) delete env[key]
  const merged: AppEnv = {
    NODE_ENV: 'test',
    NEXT_TELEMETRY_DISABLED: '1',
    PAYLOAD_SECRET: 'qa-only-secret-not-used-anywhere-else-0123456789',
    NEXT_PUBLIC_SERVER_URL: `http://127.0.0.1:${port}`,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: '1',
    SMTP_USER: '',
    SMTP_PASS: '',
    EMAIL_FROM: 'qa-sender@test.invalid',
    BOARD_NOTIFICATION_EMAIL: 'qa-board-env@test.invalid',
    CONTACT_FORWARD_EMAIL: 'qa-inbox@test.invalid',
    BLOB_READ_WRITE_TOKEN: '',
    ...overrides,
  }
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined) delete env[k]
    else env[k] = v
  }
  assertSafeDatabaseUri(env.DATABASE_URI)
  return env
}

export type RunningApp = {
  baseUrl: string
  logFile: string
  output: () => string
  stop: () => Promise<void>
}

function killTree(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null) return
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
    } catch {
      // already gone
    }
  } else {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

type StartOptions = {
  name: string
  /** `dev` (default) or `start` (serve a production build — needs NODE_ENV=production + NEXT_DIST_DIR). */
  command?: 'dev' | 'start'
  port: number
  env: AppEnv
  /** Resolve once this pattern appears in the output (instead of polling HTTP). */
  waitForLog?: RegExp
  /** Reject immediately if this pattern appears in the output. */
  failOnLog?: RegExp
  /** Poll this path until it answers with any status < 500 (default /api/users/init). */
  readyPath?: string
  /** Accept any HTTP response, including 5xx, as "ready" (used to observe startup failures). */
  acceptAnyStatus?: boolean
  timeoutMs?: number
}

export async function startApp(opts: StartOptions): Promise<RunningApp> {
  const { name, port, timeoutMs = 300_000 } = opts
  const env = buildAppEnv(port, opts.env)
  mkdirSync(LOG_DIR, { recursive: true })
  const logFile = path.join(LOG_DIR, `${name}.log`)
  const log = createWriteStream(logFile)
  let output = ''

  const child = spawn(process.execPath, [path.join(APP_ROOT, 'node_modules/next/dist/bin/next'), opts.command ?? 'dev', '--port', String(port)], {
    cwd: APP_ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  const onData = (buf: Buffer) => {
    const s = buf.toString()
    output += s
    log.write(s)
  }
  child.stdout?.on('data', onData)
  child.stderr?.on('data', onData)

  const baseUrl = `http://127.0.0.1:${port}`
  const stop = async () => {
    killTree(child)
    for (let i = 0; i < 50 && child.exitCode === null && child.signalCode === null; i++) await sleep(100)
    log.end()
    // Next's dev server holds a lock under .next/dev — give the OS a moment to release it.
    await sleep(1500)
  }
  const app: RunningApp = { baseUrl, logFile, output: () => output, stop }

  const started = Date.now()
  try {
    while (Date.now() - started < timeoutMs) {
      if (opts.failOnLog?.test(output)) throw new Error(`[${name}] failure pattern ${opts.failOnLog} seen in output`)
      if (child.exitCode !== null) throw new Error(`[${name}] exited early with code ${child.exitCode}`)
      if (opts.waitForLog) {
        if (opts.waitForLog.test(output)) return app
        // Instrumentation's register() may only run once the server handles its first request —
        // poke it (result ignored) so a log-gated boot can't stall waiting for traffic.
        if (/Ready in|Local:/.test(output)) {
          fetch(baseUrl + '/api/users/init', { signal: AbortSignal.timeout(120_000) }).catch(() => {})
        }
      } else {
        try {
          const res = await fetch(baseUrl + (opts.readyPath ?? '/api/users/init'), { signal: AbortSignal.timeout(120_000) })
          if (opts.acceptAnyStatus || res.status < 500) return app
        } catch {
          // not listening yet
        }
      }
      await sleep(1000)
    }
    throw new Error(`[${name}] not ready after ${timeoutMs}ms`)
  } catch (err) {
    await stop()
    throw new Error(`${(err as Error).message}\n--- last output ---\n${output.slice(-4000)}`)
  }
}

/**
 * `next build` for the production-startup tests. NODE_ENV=production; `__NEXT_PROCESSED_ENV=true`
 * makes @next/env skip every .env* file (node_modules/@next/env: `if(process.env.__NEXT_PROCESSED_ENV
 * ...) return [process.env]`), so .env.local can't leak in even though this isn't test mode.
 * Output goes to NEXT_DIST_DIR, never the developer's .next.
 */
export async function buildApp(name: string, port: number, env: AppEnv, timeoutMs = 900_000): Promise<{ code: number | null; output: string }> {
  const fullEnv = buildAppEnv(port, env)
  mkdirSync(LOG_DIR, { recursive: true })
  const log = createWriteStream(path.join(LOG_DIR, `${name}.log`))
  let output = ''
  const child = spawn(process.execPath, [path.join(APP_ROOT, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: APP_ROOT,
    env: fullEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  const onData = (buf: Buffer) => {
    output += buf.toString()
    log.write(buf)
  }
  child.stdout?.on('data', onData)
  child.stderr?.on('data', onData)
  const code = await new Promise<number | null>((resolve) => {
    const timer = setTimeout(() => {
      killTree(child)
      resolve(null)
    }, timeoutMs)
    child.on('exit', (c) => {
      clearTimeout(timer)
      resolve(c)
    })
  })
  log.end()
  return { code, output }
}

/** Starts a server expected to FAIL; resolves with what happened instead of throwing. */
export async function startAppExpectingFailure(
  opts: StartOptions,
  observeMs = 60_000,
): Promise<{ exited: boolean; exitCode: number | null; served200: boolean; statuses: number[]; output: string }> {
  const env = buildAppEnv(opts.port, opts.env)
  mkdirSync(LOG_DIR, { recursive: true })
  const log = createWriteStream(path.join(LOG_DIR, `${opts.name}.log`))
  let output = ''
  const child = spawn(process.execPath, [path.join(APP_ROOT, 'node_modules/next/dist/bin/next'), opts.command ?? 'dev', '--port', String(opts.port)], {
    cwd: APP_ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  const onData = (buf: Buffer) => {
    output += buf.toString()
    log.write(buf)
  }
  child.stdout?.on('data', onData)
  child.stderr?.on('data', onData)
  const statuses: number[] = []
  const started = Date.now()
  while (Date.now() - started < observeMs && child.exitCode === null) {
    try {
      const res = await fetch(`http://127.0.0.1:${opts.port}${opts.readyPath ?? '/api/users/init'}`, { signal: AbortSignal.timeout(30_000) })
      statuses.push(res.status)
      await res.text()
      if (res.status === 200) break
      if (statuses.length >= 3) break
    } catch {
      // not listening (yet / any more)
    }
    await sleep(1000)
  }
  const exited = child.exitCode !== null
  const exitCode = child.exitCode
  killTree(child)
  for (let i = 0; i < 50 && child.exitCode === null && child.signalCode === null; i++) await sleep(100)
  log.end()
  await sleep(1500)
  return { exited, exitCode, served200: statuses.includes(200), statuses, output }
}
