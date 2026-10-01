import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const QA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const APP_ROOT = path.resolve(QA_DIR, '..')
export const TMP_DIR = path.join(QA_DIR, '.tmp')
export const EVIDENCE_DIR = path.join(QA_DIR, 'evidence')
export const LOG_DIR = path.join(EVIDENCE_DIR, 'logs')
