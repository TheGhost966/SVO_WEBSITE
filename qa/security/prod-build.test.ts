/**
 * Production-build guards — things only a real `next build` shows. Uses the build shared with the
 * S3 / S14 files (harness/prodBuild.ts).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { APP_ROOT } from '../harness/paths'
import { writeEvidence } from '../harness/evidence'
import { ensureProdBuild, PROD_DIST_DIR } from '../harness/prodBuild'

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('production build', () => {
  beforeAll(async () => {
    await ensureProdBuild()
  })

  it('seed/ is not compiled into the server bundle when SEED_ON_BOOT is unset (the harness never sets it)', () => {
    // Slugs of the sample content: plain ASCII literals that exist nowhere else in the codebase.
    const markers = [...readFileSync(path.join(APP_ROOT, 'seed/sampleContent.ts'), 'utf8').matchAll(/slug: '([a-z0-9-]{18,})'/g)].map((m) => m[1])
    expect(markers.length).toBeGreaterThan(3)
    const files = walk(path.join(APP_ROOT, PROD_DIST_DIR, 'server')).filter((f) => f.endsWith('.js'))
    expect(files.length).toBeGreaterThan(20)
    const hits = files.filter((f) => {
      if (/seed_index|sampleContent/.test(path.basename(f))) return true
      const src = readFileSync(f, 'utf8')
      return markers.some((m) => src.includes(m))
    })
    writeEvidence('p2-seed-not-in-bundle', { serverJsFiles: files.length, markers: markers.length, hits: hits.map((f) => path.relative(APP_ROOT, f)) })
    expect(hits).toEqual([])
  })
})
