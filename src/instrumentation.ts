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
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const wantsStatus = Boolean(process.env.PAYLOAD_MIGRATE_STATUS)
  const wantsMigrate = Boolean(process.env.PAYLOAD_MIGRATE_ON_BOOT)
  const createName = process.env.PAYLOAD_MIGRATE_CREATE_NAME
  if (!wantsStatus && !wantsMigrate && !createName) return

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
      const { existingMigrations } = await getMigrations({ payload })
      console.log('[migrate] status:')
      for (const file of migrationFiles) {
        const applied = existingMigrations.find((m) => m.name === file.name)
        console.log(`  ${applied ? '✓ ran' : '  pending'}  ${file.name}${applied ? ` (batch ${applied.batch})` : ''}`)
      }
      if (migrationFiles.length === 0) {
        console.log('  (no migration files found)')
      }
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
      const newTsFiles = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !before.has(f))
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
