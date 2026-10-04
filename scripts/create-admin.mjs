/**
 * `npm run create-admin` — creates the first administrator account (QA S14).
 *
 * In production `POST /api/users/first-register` always answers 403, so the first account can't be
 * claimed by whoever reaches a fresh deployment first. This command is the replacement. Like
 * `npm run seed` it starts a Next.js server just long enough for the instrumentation hook to do the
 * work (a standalone script can't load payload.config.ts — see scripts/run-seed.mjs), then stops it.
 *
 * It acts on the database in DATABASE_URI (your shell's value, else .env.local), only if the `users`
 * table is empty, and always creates an `admin`. The password is asked for without echo, handed to
 * the server through its environment (never argv), and never printed or logged.
 *
 *   npm run create-admin
 *   CREATE_ADMIN_EMAIL=… CREATE_ADMIN_PASSWORD=… CREATE_ADMIN_NAME=… npm run create-admin   # non-interactive
 */
import { spawn, execSync } from 'node:child_process'
import readline from 'node:readline'

const MIN_PASSWORD_LENGTH = 12
const TIMEOUT_MS = 5 * 60 * 1000
const RESULT = /\[create-admin\] (created|skipped|failed)[^\n]*/

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    process.stdout.write(question)
    // Hidden input: readline echoes through _writeToOutput, so swallowing it keeps the typed
    // characters off the screen (and out of any terminal scrollback).
    if (hidden) rl._writeToOutput = () => {}
    rl.question('', (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer)
    })
  })
}

async function collect() {
  let email = (process.env.CREATE_ADMIN_EMAIL ?? '').trim()
  let name = (process.env.CREATE_ADMIN_NAME ?? '').trim()
  let password = process.env.CREATE_ADMIN_PASSWORD ?? ''
  const interactive = Boolean(process.stdin.isTTY)

  if (!email || !password) {
    if (!interactive) {
      console.error('[create-admin] not an interactive terminal: set CREATE_ADMIN_EMAIL and CREATE_ADMIN_PASSWORD.')
      process.exit(1)
    }
    if (!email) email = (await ask('Admin email: ')).trim()
    if (!name) name = (await ask('Display name [Administrator]: ')).trim()
    if (!password) {
      password = await ask(`Password (min. ${MIN_PASSWORD_LENGTH} characters, not shown): `, { hidden: true })
      const again = await ask('Repeat password: ', { hidden: true })
      if (password !== again) {
        console.error('[create-admin] the two passwords do not match — nothing was created.')
        process.exit(1)
      }
    }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`[create-admin] the password must be at least ${MIN_PASSWORD_LENGTH} characters — nothing was created.`)
    process.exit(1)
  }
  return { email, name, password }
}

const { email, name, password } = await collect()

// 127.0.0.1 only: this temporary server must not be reachable from the network while it runs.
const child = spawn('npx', ['next', 'dev', '--hostname', '127.0.0.1', '--port', process.env.CREATE_ADMIN_PORT ?? '3998'], {
  env: {
    ...process.env,
    CREATE_ADMIN_ON_BOOT: '1',
    CREATE_ADMIN_EMAIL: email,
    CREATE_ADMIN_NAME: name,
    CREATE_ADMIN_PASSWORD: password,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
})

let settled = false
let output = ''

/** Same reason as scripts/run-seed.mjs: with `shell: true` the direct child is cmd.exe. */
function killTree() {
  if (!child.pid) return
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
      return
    } catch {
      // Already gone — fall through.
    }
  }
  try {
    child.kill()
  } catch {
    /* already exited */
  }
}

function finish(code) {
  if (settled) return
  settled = true
  clearTimeout(timer)
  killTree()
  setTimeout(() => process.exit(code), 500)
}

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => finish(1))

const timer = setTimeout(() => {
  console.error('\n[create-admin] timed out after 5 minutes — is the database reachable?')
  finish(1)
}, TIMEOUT_MS)

function watch(chunk) {
  output += chunk.toString()
  const match = output.match(RESULT)
  if (!match) return
  // Only the outcome line is shown; it never contains the password (src/lib/firstAdmin.ts).
  console.log(match[0])
  if (match[1] === 'created') console.log('[create-admin] sign in at /admin with that email address.')
  finish(match[1] === 'failed' ? 1 : 0)
}

child.stdout.on('data', watch)
child.stderr.on('data', watch)
child.on('error', (err) => {
  console.error('[create-admin] could not start Next.js:', err.message)
  finish(1)
})
child.on('exit', (code) => {
  if (!settled) {
    console.error(`\n[create-admin] Next.js exited (code ${code}) before reporting a result.`)
    console.error(output.split(password).join('<redacted>').slice(-2000))
    finish(code ?? 1)
  }
})
