import net from 'node:net'
import path from 'node:path'
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { TMP_DIR } from './paths'

/**
 * Minimal local SMTP sink (127.0.0.1 only, no auth, no TLS, no relaying). It accepts every message
 * and appends `{ from, to, data }` as one JSON line to qa/.tmp/mail.jsonl, so tests can assert who an
 * email was addressed to. Nothing is ever delivered anywhere.
 */
export const SMTP_SINK_PORT = 2526
export const MAIL_LOG = path.join(TMP_DIR, 'mail.jsonl')

export type SunkMail = { from: string; to: string[]; data: string }

export function startSmtpSink(): Promise<net.Server> {
  mkdirSync(TMP_DIR, { recursive: true })
  rmSync(MAIL_LOG, { force: true })
  const server = net.createServer((socket) => {
    let buffer = ''
    let inData = false
    let mail: SunkMail = { from: '', to: [], data: '' }
    const reply = (line: string) => socket.write(`${line}\r\n`)
    reply('220 qa-smtp-sink ready')
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      let idx: number
      while ((idx = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        if (inData) {
          if (line === '.') {
            inData = false
            appendFileSync(MAIL_LOG, JSON.stringify(mail) + '\n')
            mail = { from: '', to: [], data: '' }
            reply('250 OK queued')
          } else {
            mail.data += (line.startsWith('..') ? line.slice(1) : line) + '\n'
          }
          continue
        }
        const cmd = line.slice(0, 4).toUpperCase()
        if (cmd === 'EHLO' || cmd === 'HELO') reply('250 qa-smtp-sink')
        else if (cmd === 'MAIL') {
          mail.from = line.replace(/^MAIL FROM:\s*/i, '').replace(/[<>]/g, '').split(' ')[0]
          reply('250 OK')
        } else if (cmd === 'RCPT') {
          mail.to.push(line.replace(/^RCPT TO:\s*/i, '').replace(/[<>]/g, '').split(' ')[0])
          reply('250 OK')
        } else if (cmd === 'DATA') {
          inData = true
          reply('354 End data with <CR><LF>.<CR><LF>')
        } else if (cmd === 'QUIT') {
          reply('221 Bye')
          socket.end()
        } else reply('250 OK') // RSET, NOOP, …
      }
    })
    socket.on('error', () => {})
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(SMTP_SINK_PORT, '127.0.0.1', () => resolve(server))
  })
}

export function readMail(): SunkMail[] {
  try {
    return readFileSync(MAIL_LOG, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as SunkMail)
  } catch {
    return []
  }
}

/** Polls the mail log until `predicate` matches a message (or times out → undefined). */
export async function waitForMail(predicate: (m: SunkMail) => boolean, timeoutMs = 15_000): Promise<SunkMail | undefined> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const hit = readMail().find(predicate)
    if (hit) return hit
    await new Promise((r) => setTimeout(r, 250))
  }
  return undefined
}
