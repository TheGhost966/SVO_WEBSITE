import path from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { APP_ROOT } from './paths'

/**
 * `next dev` rewrites tsconfig.json (adds an `include` entry for its type dir) and next-env.d.ts on
 * boot, and does so differently under NODE_ENV=test. Snapshot both before any app boot and put
 * them back at teardown so a QA run leaves the working tree exactly as it found it.
 */
const FILES = ['tsconfig.json', 'next-env.d.ts']

export function snapshotRepoFiles(): () => void {
  const saved = FILES.map((f) => {
    const p = path.join(APP_ROOT, f)
    return { p, content: existsSync(p) ? readFileSync(p) : null }
  })
  return () => {
    for (const { p, content } of saved) {
      if (content !== null && (!existsSync(p) || !readFileSync(p).equals(content))) writeFileSync(p, content)
    }
  }
}
