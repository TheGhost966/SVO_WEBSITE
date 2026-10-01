import type { PostgresAdapter } from '@payloadcms/db-postgres'

/**
 * Runs Payload database-migration operations at server boot, gated behind explicit opt-in env
 * vars — never automatic, never network-reachable.
 *
 * Why this exists: every standalone `payload`-CLI migration command (`payload migrate`,
 * `migrate:create`, etc.) crashes in this project from tsx/Node ESM-CJS interop bugs deep in
 * Payload's own dependency chain — see DECISIONS.md "Known issues". `next dev`/`next build` load
 * `payload.config.ts` fine (Turbopack/SWC, no tsx involved), and this file runs once inside that
 * same working pipeline before the server starts handling requests, so calling the underlying
 * adapter methods here (the same ones the CLI calls) sidesteps the bug entirely.
 *
 * An HTTP route was tried first and rejected — a secret-gated endpoint that executes privileged
 * DB operations on request is a standing network attack surface even when gated. This hook has
 * none: it only fires once per process boot, reads no request, and does nothing unless the
 * operator has explicitly set one of the env vars below for that specific boot.
 *
 * Usage: set the relevant env var, start the server once (`next dev` or `next start`), watch the
 * console for the result, then unset the var so the next normal boot doesn't repeat it.
 *   PAYLOAD_MIGRATE_STATUS=1        — log which migrations exist vs. have been applied
 *   PAYLOAD_MIGRATE_ON_BOOT=1       — apply all pending migrations
 *   PAYLOAD_MIGRATE_CREATE_NAME=foo — write a new migration file capturing the current schema diff
 *   SEED_ON_BOOT=1                  — populate the database with configuration + sample content
 *                                     (seed/index.ts). `npm run seed` sets this for you.
 *   PAYLOAD_MIGRATE_BASELINE=<name> — mark <name> as already-applied (batch 1) without running its
 *                                     up(), and clear the batch:-1 dev-push sentinel row. Use once,
 *                                     for a database whose schema came from dev-mode push rather
 *                                     than migrations — see DECISIONS.md "Unlocalized slugs".
 */
/**
 * Dev-only, unconditional (no opt-in env var needed) — the opposite of the gated operations
 * below. `getSiteSettings()` in src/lib/queries.ts wraps its `payload.findGlobal` call in a bare
 * try/catch that returns `null` on any error, including "column does not exist" when the
 * `SiteSettings.homeGroup` fields exist in the Payload config but the migration adding their
 * columns hasn't been applied yet. The homepage then silently renders its in-code fallback copy
 * and looks like a working CMS-backed page when it isn't reading from the CMS at all. This check
 * queries the DB schema directly (not through Payload's query layer, so it can't be swallowed by
 * that same try/catch) and warns loudly on every dev boot until the migration is applied.
 */
async function warnIfHomeGroupSchemaMissing() {
  try {
    const { getPayload } = await import('payload')
    const { sql } = await import('@payloadcms/db-postgres')
    const { default: config } = await import('@payload-config')
    const payload = await getPayload({ config })
    const adapter = payload.db as unknown as PostgresAdapter
    const result = (await adapter.drizzle.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'site_settings' AND column_name = 'home_group_hero_cta_href'
    `)) as unknown as { rows?: unknown[] } | unknown[]
    const rows = Array.isArray(result) ? result : (result.rows ?? [])
    if (rows.length === 0) {
      console.warn(
        '\n' +
          '!'.repeat(78) +
          '\n[schema-warning] SiteSettings.homeGroup is NOT in the database schema yet.\n' +
          'Homepage sections are rendering in-code fallback copy, not real CMS content —\n' +
          'this can look like a working homepage while editing it in /admin does nothing.\n' +
          'Apply the pending migrations (see DECISIONS.md "Migration path fix") to fix this.\n' +
          '!'.repeat(78) +
          '\n',
      )
    }
  } catch (err) {
    console.warn(
      '[schema-warning] could not check SiteSettings.homeGroup schema state:',
      err instanceof Error ? err.message : err,
    )
  }
}

export async function register() {
  // Fail at boot, not on the first request: in production an unset/weak PAYLOAD_SECRET throws here
  // (QA S3). payload.config.ts calls the same resolver, so this is the earliest of two guards.
  const { resolvePayloadSecret } = await import('./lib/payloadSecret')
  resolvePayloadSecret()

  if (process.env.NODE_ENV !== 'production') {
    await warnIfHomeGroupSchemaMissing()
  }

  // Seeding runs here for the same reason the migration operations do: a standalone tsx entry
  // point can't load payload.config.ts (see the comment at the top of seed/index.ts). It is
  // deliberately *not* grouped with the PAYLOAD_MIGRATE_* block below, because that block sets
  // PAYLOAD_MIGRATING=true — a flag Payload uses to suppress normal write behaviour, which is
  // the opposite of what seeding needs.
  if (process.env.SEED_ON_BOOT) {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@payload-config')
    const { runSeed } = await import('../seed/index')
    const payload = await getPayload({ config })
    try {
      await runSeed(payload)
      console.log('[seed] complete')
    } catch (err) {
      console.error('[seed] failed:', err instanceof Error ? err.stack : err)
      console.log('[seed] failed')
    }
  }

  const wantsStatus = Boolean(process.env.PAYLOAD_MIGRATE_STATUS)
  const wantsMigrate = Boolean(process.env.PAYLOAD_MIGRATE_ON_BOOT)
  const createName = process.env.PAYLOAD_MIGRATE_CREATE_NAME
  const baselineName = process.env.PAYLOAD_MIGRATE_BASELINE
  if (!wantsStatus && !wantsMigrate && !createName && !baselineName) return

  // Defense in depth alongside postgresAdapter's push: false — matches the exact guard
  // node_modules/payload/dist/bin/migrate.js sets before payload.init() for the same reason:
  // dev-mode auto-push must never race a migration operation.
  process.env.PAYLOAD_MIGRATING = 'true'

  const { getPayload, getMigrations, readMigrationFiles } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const adapter = payload.db

  try {
    if (wantsStatus) {
      const migrationFiles = await readMigrationFiles({ payload })
      // A brand-new database has no payload_migrations table yet (migrate() creates it on first
      // run), so getMigrations throws `relation ... does not exist` — that means "nothing applied".
      let existingMigrations: Awaited<ReturnType<typeof getMigrations>>['existingMigrations'] = []
      try {
        ;({ existingMigrations } = await getMigrations({ payload }))
      } catch (err) {
        const cause = (err as { cause?: { message?: string } })?.cause?.message ?? ''
        if (!/payload_migrations" does not exist/.test(cause)) throw err
        console.log('[migrate] payload_migrations table does not exist yet — treating as zero applied')
      }
      console.log('[migrate] status:')
      for (const file of migrationFiles) {
        const applied = existingMigrations.find((m) => m.name === file.name)
        console.log(`  ${applied ? '✓ ran' : '  pending'}  ${file.name}${applied ? ` (batch ${applied.batch})` : ''}`)
      }
      if (migrationFiles.length === 0) {
        console.log('  (no migration files found)')
      }
    }

    if (baselineName) {
      // Marks a migration as already-applied without running its up() — for exactly the situation
      // documented in DECISIONS.md "Unlocalized slugs": this database's schema came from dev-mode
      // push, not from `initial_schema`, so running that file's up() fails on `relation already
      // exists` (confirmed). Also clears Payload's own `batch: -1` dev-push sentinel row, since
      // adapter.migrate() checks for it on every future call and re-prompts otherwise — leaving it
      // in place after baselining would just re-trigger the same prompt for no reason.
      const { sql } = await import('@payloadcms/db-postgres')
      const pgAdapter = adapter as unknown as PostgresAdapter
      await pgAdapter.drizzle.execute(sql`DELETE FROM payload_migrations WHERE batch = -1`)
      await pgAdapter.drizzle.execute(
        sql`INSERT INTO payload_migrations (name, batch, created_at, updated_at) VALUES (${baselineName}, 1, now(), now())`,
      )
      console.log(`[migrate] baselined "${baselineName}" as already-applied (batch 1), cleared dev-push sentinel`)
    }

    if (createName) {
      const fs = await import('fs')
      const path = await import('path')
      const dir = adapter.migrationDir
      const before = new Set(fs.readdirSync(dir))

      await adapter.createMigration({
        payload,
        migrationName: createName,
        // Non-interactive — boot has no TTY to prompt.
        forceAcceptWarning: true,
      })

      // createMigration always writes .ts (Payload's template is hardcoded) — but readMigrationFiles'
      // dynamicImport is a plain native import(), which can't parse TypeScript outside next dev's
      // Turbopack loader. Under next start (real production), a raw .ts migration file fails with
      // ERR_UNKNOWN_FILE_EXTENSION — confirmed the hard way. Converting to .js here (stripping the
      // type-only import and two type annotations — the only TS-specific syntax the template emits)
      // makes every migration this hook creates work identically in dev and production, always.
      // Excludes index.ts: createMigration rewrites it unconditionally on every call, so it
      // always looks "new" here even though nothing reads it (readMigrationFiles lists the
      // directory directly — see its own filter excluding index.js/.ts) — it's deleted below
      // instead of converted. Converting it first (as an earlier version of this loop did) left
      // a stray, never-deleted index.js behind, since the unlink check below only looks for
      // index.ts.
      const newTsFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !before.has(f))
      for (const file of newTsFiles) {
        const tsPath = path.join(dir, file)
        let content = fs.readFileSync(tsPath, 'utf8')
        content = content
          .replace(
            /import \{ MigrateUpArgs, MigrateDownArgs, sql \} from '@payloadcms\/db-postgres'/,
            "import { sql } from '@payloadcms/db-postgres'",
          )
          .replace(
            /export async function up\(\{ db, payload, req \}: MigrateUpArgs\): Promise<void> \{/,
            'export async function up({ db, payload, req }) {',
          )
          .replace(
            /export async function down\(\{ db, payload, req \}: MigrateDownArgs\): Promise<void> \{/,
            'export async function down({ db, payload, req }) {',
          )
        const jsPath = tsPath.replace(/\.ts$/, '.js')
        fs.writeFileSync(jsPath, content)
        fs.unlinkSync(tsPath)
        console.log(`[migrate] converted ${file} -> ${path.basename(jsPath)} (production needs .js, not .ts)`)
      }

      // createMigration also (re)writes migrations/index.ts unconditionally, every time. Nothing in
      // this project's migration flow reads it — readMigrationFiles lists the directory directly —
      // so it's pure dead weight (and it would be yet another stray .ts file). Delete it rather than
      // maintain a second, easily-stale copy in .js.
      const indexTsPath = path.join(dir, 'index.ts')
      if (fs.existsSync(indexTsPath)) fs.unlinkSync(indexTsPath)

      console.log(`[migrate] created migration "${createName}"`)
    }

    if (wantsMigrate) {
      await adapter.migrate()
      console.log('[migrate] applied pending migrations')
    }
  } catch (err) {
    console.error('[migrate] failed:', err instanceof Error ? err.message : err)
    throw err
  }
}
