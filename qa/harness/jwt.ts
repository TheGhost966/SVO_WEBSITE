import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

/**
 * Mirrors how Payload derives its JWT key (payload/dist/index.js):
 *   this.secret = sha256(config.secret).hex.slice(0, 32)
 * and how the JWT strategy verifies it (payload/dist/auth/strategies/jwt.js):
 *   jwtVerify(token, new TextEncoder().encode(payload.secret))   // HS256
 * Used ONLY against the disposable local test server started by this harness.
 */
export function payloadKey(configSecret: string): Buffer {
  return Buffer.from(createHash('sha256').update(configSecret).digest('hex').slice(0, 32), 'utf8')
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url')

export function signHS256(claims: Record<string, unknown>, key: Buffer): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(claims))
  const sig = createHmac('sha256', key).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

export function decode(token: string): { header: Record<string, unknown>; claims: Record<string, unknown> } {
  const [h, p] = token.split('.')
  return { header: JSON.parse(Buffer.from(h, 'base64url').toString()), claims: JSON.parse(Buffer.from(p, 'base64url').toString()) }
}

/** True if `token`'s signature verifies under `key` — i.e. the server signed it with that key. */
export function verifiesWith(token: string, key: Buffer): boolean {
  const [h, p, s] = token.split('.')
  const expected = createHmac('sha256', key).update(`${h}.${p}`).digest()
  const actual = Buffer.from(s, 'base64url')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export { randomUUID }
