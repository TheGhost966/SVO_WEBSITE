/**
 * Resolves the Payload secret (QA S3).
 *
 * Production (NODE_ENV=production — `next build` and `next start`): PAYLOAD_SECRET must be set, at
 * least 32 characters, and not a known placeholder. Anything else throws, so the server refuses to
 * start instead of signing sessions with a value that's public in this repository.
 *
 * Everywhere else (development, test, tooling): an unset PAYLOAD_SECRET falls back to a fixed
 * dev-only value so a fresh checkout boots without setup. That value is on the production denylist.
 *
 * Error messages never include the secret itself.
 */
export const DEV_ONLY_FALLBACK_SECRET = 'INSECURE_DEV_SECRET_REPLACE_ME'
export const MIN_PRODUCTION_SECRET_LENGTH = 32

const KNOWN_INSECURE_SECRETS = new Set([
  DEV_ONLY_FALLBACK_SECRET,
  'replace-with-a-long-random-secret-min-32-chars', // .env.example placeholder
])

type SecretEnv = { NODE_ENV?: string; PAYLOAD_SECRET?: string }

export function resolvePayloadSecret(env: SecretEnv = process.env): string {
  const secret = env.PAYLOAD_SECRET
  if (env.NODE_ENV !== 'production') return secret ?? DEV_ONLY_FALLBACK_SECRET

  const fail = (reason: string) =>
    new Error(
      `[config] PAYLOAD_SECRET ${reason}. Refusing to start in production. ` +
        `Set it to a random value of at least ${MIN_PRODUCTION_SECRET_LENGTH} characters (e.g. \`openssl rand -hex 32\`).`,
    )
  if (!secret) throw fail('is not set')
  if (KNOWN_INSECURE_SECRETS.has(secret)) throw fail('is a known placeholder/default value')
  if (secret.length < MIN_PRODUCTION_SECRET_LENGTH) throw fail(`is shorter than ${MIN_PRODUCTION_SECRET_LENGTH} characters`)
  return secret
}
