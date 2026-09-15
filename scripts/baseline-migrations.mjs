// Baseline payload_migrations on a database whose schema already matches initial_schema (built via
// prior dev-mode push, not via that migration file): remove Payload's dev-mode sentinel row and
// record initial_schema as already-applied, so `migrate()` runs only genuinely new migrations.
// Reads DATABASE_URI from process.env — pass it explicitly, don't hardcode a connection string here.
import { Client } from 'pg'

const uri = process.env.DATABASE_URI
if (!uri) {
  console.error('Set DATABASE_URI before running this script.')
  process.exit(1)
}

const client = new Client({ connectionString: uri })
await client.connect()
try {
  await client.query('BEGIN')
  const del = await client.query(`DELETE FROM payload_migrations WHERE batch = -1`)
  console.log('removed dev-mode sentinel rows:', del.rowCount)
  const ins = await client.query(
    `INSERT INTO payload_migrations (name, batch) VALUES ($1, 1) ON CONFLICT DO NOTHING`,
    ['20260915_103709_initial_schema'],
  )
  console.log('baselined initial_schema as batch 1:', ins.rowCount)
  await client.query('COMMIT')
} catch (err) {
  await client.query('ROLLBACK')
  throw err
} finally {
  await client.end()
}
