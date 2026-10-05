/**
 * `npm run seed` — starts a Next.js dev server with SEED_ON_BOOT=1 just long enough for the
 * instrumentation hook to run the seed, then shuts it down.
 *
 * The seed can't run as a plain `tsx seed/index.ts` script: every standalone entry point that
 * loads `payload.config.ts` through tsx dies inside Payload's own ESM/CJS interop (here:
 * `Cannot destructure property 'loadEnvConfig' of 'import_env.default'`). The same problem is
 * why this project's migrations moved into `src/instrumentation.node.ts`. Seeding now runs from that same hook, and this launcher exists so the
 * published command stays `npm run seed` instead of a platform-specific env-var incantation
 * that behaves differently in bash, cmd and PowerShell.
 */
import { spawn, execSync } from 'node:child_process'

const DONE = '[seed] complete'
const FAILED = '[seed] failed'
// Boot + full seed is a few seconds; this is only a backstop against hanging CI.
const TIMEOUT_MS = 5 * 60 * 1000

const child = spawn('npx', ['next', 'dev', '--port', process.env.SEED_PORT ?? '3999'], {
  env: { ...process.env, SEED_ON_BOOT: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
})

let settled = false

/**
 * `child.kill()` alone is not enough on Windows: `shell: true` means the direct child is cmd.exe,
 * and killing it leaves the actual `next dev` node process running and holding the port, so the
 * next `npm run seed` dies with EADDRINUSE. `taskkill /T` takes the whole tree.
 */
function killTree() {
  if (!child.pid) return
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
      return
    } catch {
      // Already gone, or taskkill unavailable — fall through to the portable path.
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
  // Give the tree a moment to die before the parent exits, so no stray server is left holding
  // the port.
  setTimeout(() => process.exit(code), 500)
}

// A Ctrl-C partway through must not leave a server behind either.
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => finish(1))

const timer = setTimeout(() => {
  console.error('\n[seed] timed out after 5 minutes — is the database reachable?')
  finish(1)
}, TIMEOUT_MS)

function watch(chunk) {
  const text = chunk.toString()
  // Next's own boot chatter isn't interesting here; the seed's own output is.
  const lines = text.split('\n').filter((l) => !/^\s*[▲-]|Local:|Network:|Ready in|Starting\.\.\.|experimental|Warning: Next\.js ignored/.test(l))
  if (lines.join('\n').trim()) process.stdout.write(lines.join('\n'))
  if (text.includes(DONE)) finish(0)
  else if (text.includes(FAILED)) finish(1)
}

child.stdout.on('data', watch)
child.stderr.on('data', watch)
child.on('error', (err) => {
  console.error('[seed] could not start Next.js:', err.message)
  finish(1)
})
child.on('exit', (code) => {
  if (!settled) {
    console.error(`\n[seed] Next.js exited (code ${code}) before the seed reported a result.`)
    finish(code ?? 1)
  }
})
