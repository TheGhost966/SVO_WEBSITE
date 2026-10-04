/**
 * Performance-hygiene guards (not security findings).
 *
 *  - The harness never compiles into the app's `.next`: every boot gets its own NEXT_DIST_DIR under
 *    qa/.tmp, and the tsconfig / next-env snapshot covers the entries Next adds for such a directory.
 *  - getGuideTopics (BRIEF-AMENDMENT-02 §2.7) asks the database which topics have a published
 *    article (DISTINCT + limit) instead of reading every published article — the result must still
 *    be exactly "topics with at least one published article".
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { assertHarnessDistDir, buildAppEnv, distDirFor } from '../harness/app'
import { writeEvidence } from '../harness/evidence'
import { APP_ROOT } from '../harness/paths'
import { stripHarnessEntries } from '../harness/repoFiles'
import { qaDatabaseUri } from '../harness/safety'
import { uniq } from '../harness/seed'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)
const admin = fx.tokens.admin

describe('QA harness: its own NEXT_DIST_DIR per boot, never the app’s .next', () => {
  const env = (overrides: Record<string, string | undefined> = {}) =>
    buildAppEnv('p0-app', 3100, { DATABASE_URI: qaDatabaseUri('svo_qa_test_p0'), ...overrides })

  it('every boot defaults to qa/.tmp/next-<boot name>', () => {
    expect(env().NEXT_DIST_DIR).toBe('qa/.tmp/next-p0-app')
    expect(distDirFor('s3 secret/unset')).toBe('qa/.tmp/next-s3-secret-unset')
  })

  it.each(['.next', '.next/qa-prod', '', 'qa/.tmp', 'qa/.tmp/pg', 'qa/.tmp/next-a/../../../.next', '../outside', 'C:/elsewhere/next-x'])(
    'refuses to build an environment with NEXT_DIST_DIR=%j',
    (distDir) => {
      expect(() => env({ NEXT_DIST_DIR: distDir })).toThrow(/qa-safety/)
      expect(() => assertHarnessDistDir(distDir)).toThrow(/qa-safety/)
    },
  )

  it('the server these tests talk to is compiling into its own directory right now', () => {
    expect(existsSync(path.join(APP_ROOT, distDirFor('p0-app')))).toBe(true)
  })

  it('stripHarnessEntries removes the tsconfig include entries Next adds for a harness distDir — and nothing else', () => {
    const base = {
      compilerOptions: { strict: true, paths: { '@/*': ['./src/*'] } },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'],
      exclude: ['node_modules', 'qa/.tmp'],
    }
    const polluted = {
      ...base,
      include: [...base.include, 'qa/.tmp/next-p0-app/types/**/*.ts', 'qa/.tmp/next-p0-app/dev/types/**/*.ts', 'qa/.tmp/next-prod/types/**/*.ts'],
    }
    const cleaned = JSON.parse(stripHarnessEntries('tsconfig.json', JSON.stringify(polluted, null, 2) + '\n'))
    expect(cleaned).toEqual(base)
    // A file without harness entries comes back byte-identical (no reformatting churn).
    const clean = JSON.stringify(base, null, 4) + '\n'
    expect(stripHarnessEntries('tsconfig.json', clean)).toBe(clean)
  })

  it('stripHarnessEntries points next-env.d.ts back at the app’s own dist dir', () => {
    const polluted = '/// <reference types="next" />\nimport "./qa/.tmp/next-p0-app/dev/types/routes.d.ts";\nimport "./qa/.tmp/next-p0-app/dev/types/root-params.d.ts";\n'
    expect(stripHarnessEntries('next-env.d.ts', polluted)).toBe(
      '/// <reference types="next" />\nimport "./.next/dev/types/routes.d.ts";\nimport "./.next/dev/types/root-params.d.ts";\n',
    )
  })

  it('whatever Next has written into the repo’s tsconfig.json / next-env.d.ts during this run is removable', () => {
    const live = Object.fromEntries(['tsconfig.json', 'next-env.d.ts'].map((f) => [f, readFileSync(path.join(APP_ROOT, f), 'utf8')]))
    writeEvidence('p2-repo-files-during-run', {
      tsconfigInclude: JSON.parse(live['tsconfig.json']).include,
      nextEnvImports: live['next-env.d.ts'].split('\n').filter((l) => l.startsWith('import')),
    })
    // (tsconfig's own `exclude` legitimately names qa/.tmp — only the per-boot next-* entries must go.)
    for (const [file, text] of Object.entries(live)) expect(stripHarnessEntries(file, text), file).not.toMatch(/qa\/\.tmp\/next-/)
    // The restore target is what's on disk minus the harness entries — tsconfig stays valid JSON.
    expect(JSON.parse(stripHarnessEntries('tsconfig.json', live['tsconfig.json'])).include).toEqual(
      expect.arrayContaining(['next-env.d.ts', '**/*.ts', '**/*.tsx']),
    )
  })
})

describe('getGuideTopics: topics with at least one published article (BRIEF-AMENDMENT-02 §2.7)', () => {
  const page = async (p: string) => {
    const res = await fetch(fx.baseUrl + p, { signal: AbortSignal.timeout(180_000) })
    return { status: res.status, html: await res.text() }
  }
  const createTopic = async (label: string, order: number) => {
    const res = await api.post('/api/guide-topics', { title: `QA topic ${label}`, slug: uniq(`qa-topic-${label}`), order }, admin)
    expect(res.status).toBe(201)
    return res.body.doc as { id: number | string; slug: string }
  }
  const createArticle = async (topicId: number | string, reviewStatus: string) => {
    const slug = uniq(`qa-guide-${reviewStatus}`)
    const res = await api.post(
      '/api/guide-articles',
      { title: `QA guide ${slug}`, slug, topic: topicId, lastReviewedAt: new Date().toISOString(), reviewIntervalMonths: 12, reviewStatus },
      admin,
    )
    expect(res.status).toBe(201)
  }

  it('lists published-article topics on /de/oesterreich-guide and the homepage; hides empty and unpublished-only topics', async () => {
    const seeded = (await api.get(`/api/guide-topics/${fx.topicId}`, admin)).body as { slug: string }
    const empty = await createTopic('empty', 50)
    const draftOnly = await createTopic('draftonly', 51)
    const inReviewOnly = await createTopic('inreviewonly', 52)
    const archivedOnly = await createTopic('archivedonly', 53)
    const published = await createTopic('published', 54)
    await createArticle(draftOnly.id, 'draft')
    await createArticle(inReviewOnly.id, 'in_review')
    await createArticle(archivedOnly.id, 'archived')
    // Two published articles under one topic: the topic must appear once, not twice.
    await createArticle(published.id, 'published')
    await createArticle(published.id, 'published')

    const link = (slug: string) => `/de/oesterreich-guide/${slug}"`
    const count = (html: string, slug: string) => html.split(link(slug)).length - 1
    const guide = await page('/de/oesterreich-guide')
    const home = await page('/de')
    writeEvidence('p2-guide-topics', {
      guideStatus: guide.status,
      homeStatus: home.status,
      guide: Object.fromEntries([seeded, empty, draftOnly, inReviewOnly, archivedOnly, published].map((t) => [t.slug, count(guide.html, t.slug)])),
    })
    expect(guide.status).toBe(200)
    expect(home.status).toBe(200)
    for (const html of [guide.html, home.html]) {
      expect(html).toContain(link(seeded.slug))
      expect(html).toContain(link(published.slug))
      for (const hidden of [empty, draftOnly, inReviewOnly, archivedOnly]) expect(html).not.toContain(link(hidden.slug))
    }
  })
})

describe('RTL: off-screen form fields use a logical offset', () => {
  // Found by the functional review: the honeypot was hidden with a physical `left: -9999px`, which on
  // a right-to-left page is scrollable overflow (/ar/contact scrolled sideways by ~10,000px).
  it.each(['/ar/contact', '/ar/experts/apply', '/de/kontakt', '/de/experten/eintragen'])('%s hides its honeypot with inset-inline-start', async (p) => {
    const res = await fetch(fx.baseUrl + p, { signal: AbortSignal.timeout(180_000) })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('name="company"')
    expect(html).not.toContain('-left-[9999px]')
    expect(html).toContain('-start-[9999px]')
  })
})
