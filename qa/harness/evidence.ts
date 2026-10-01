import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { EVIDENCE_DIR } from './paths'

/** Writes raw request/response evidence to qa/evidence/<name>.json (gitignored, regenerated per run). */
export function writeEvidence(name: string, data: unknown): string {
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = path.join(EVIDENCE_DIR, name.endsWith('.md') ? name : `${name}.json`)
  writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2))
  return file
}
