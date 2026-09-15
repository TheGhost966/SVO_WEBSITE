// JS-based substitute for pg_dump (not installed on this machine). Dumps every row from every
// public table as JSON, one file per table, under backups/<timestamp>/. Functionally equivalent
// backup for a database this small — restore by re-inserting via the same `pg` client if ever
// needed (no automated restore script; this is belt-and-braces before a schema migration, not a
// general-purpose backup tool).
import { Client } from 'pg'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const client = new Client({ connectionString: env.DATABASE_URI })
await client.connect()

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const dir = `backups/${stamp}`
mkdirSync(dir, { recursive: true })

const { rows: tables } = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
)

let totalRows = 0
for (const { tablename } of tables) {
  const { rows } = await client.query(`SELECT * FROM "${tablename}"`)
  writeFileSync(`${dir}/${tablename}.json`, JSON.stringify(rows, null, 2))
  totalRows += rows.length
  console.log(`${tablename}: ${rows.length} rows`)
}

console.log(`\nBacked up ${tables.length} tables, ${totalRows} total rows, to ${dir}/`)
await client.end()
