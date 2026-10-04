import path from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { APP_ROOT } from './paths'

/**
 * Next rewrites two tracked files whenever a server boots, and both rewrites name the dist dir:
 *  - tsconfig.json gains `include` entries — `<distDir>/types/**\/*.ts` and
 *    `<distDir>/dev/types/**\/*.ts` — for every custom NEXT_DIST_DIR it sees;
 *  - next-env.d.ts imports its route types from `./<distDir>/…`.
 * Every harness boot has its own dist dir under qa/.tmp (harness/app.ts), so a run would otherwise
 * leave a handful of `qa/.tmp/next-*` entries behind. Snapshot both files before any boot and put
 * them back at teardown, so a QA run leaves the working tree exactly as it found it.
 *
 * A run that was killed never reaches teardown; its entries would then be *in* the next snapshot
 * and get "restored" forever. So the snapshot itself is cleaned of harness entries first.
 */
const FILES = ['tsconfig.json', 'next-env.d.ts']
const HARNESS_DIST = /qa\/\.tmp\/next-[^/"']+/

/** `text` (the content of `file`) without anything Next added for a harness dist dir. */
export function stripHarnessEntries(file: string, text: string): string {
  if (!HARNESS_DIST.test(text)) return text
  if (file === 'tsconfig.json') {
    const crlf = text.includes('\r\n')
    const json = JSON.parse(text) as { include?: unknown }
    if (Array.isArray(json.include)) json.include = json.include.filter((entry) => !(typeof entry === 'string' && HARNESS_DIST.test(entry)))
    const out = JSON.stringify(json, null, 2) + '\n'
    return crlf ? out.replace(/\n/g, '\r\n') : out
  }
  // next-env.d.ts: point the route-type imports back at the app's own dist dir.
  return text.replace(/\.\/qa\/\.tmp\/next-[^/"']+\//g, './.next/')
}

export function snapshotRepoFiles(): () => void {
  const saved = FILES.map((f) => {
    const p = path.join(APP_ROOT, f)
    if (!existsSync(p)) return { p, content: null }
    const onDisk = readFileSync(p, 'utf8')
    const content = stripHarnessEntries(f, onDisk)
    if (content !== onDisk) writeFileSync(p, content) // left behind by a killed run
    return { p, content }
  })
  return () => {
    for (const { p, content } of saved) {
      if (content !== null && (!existsSync(p) || readFileSync(p, 'utf8') !== content)) writeFileSync(p, content)
    }
  }
}
