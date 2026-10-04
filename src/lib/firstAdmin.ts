/**
 * First-administrator bootstrap (QA S14).
 *
 * Payload's built-in `POST /api/users/first-register` lets *anyone* who reaches a deployment with
 * an empty `users` table create the first account, with a role of their choosing. On a fresh
 * production deploy that is a race between the operator and the internet.
 *
 * - `firstRegisterEndpoint` replaces the built-in route (custom collection endpoints are matched
 *   before Payload's own). Production: always 403, pointing at the command below. Outside
 *   production it stays open so a fresh checkout still works from /admin, but the role is forced
 *   to `admin` instead of taken from the request body.
 * - `createFirstAdmin` is the production path: `npm run create-admin`, or one server boot with
 *   CREATE_ADMIN_ON_BOOT=1 (src/instrumentation.node.ts). It reads no request, acts only on an
 *   empty `users` table, and always creates an `admin`.
 * - `preventLastAdminDelete` keeps at least one admin, because with the HTTP route closed there is
 *   no way back into an installation that has users but no administrator.
 */
import { APIError, addDataAndFileToRequest, headersWithCors, registerFirstUserOperation } from 'payload'
import type { CollectionBeforeDeleteHook, Endpoint, Payload } from 'payload'
import { generatePayloadCookie } from 'payload/shared'

const USERS = 'users'

export const CREATE_ADMIN_COMMAND = 'npm run create-admin'

export const FIRST_REGISTER_DISABLED_MESSAGE =
  'Creating the first user over HTTP is disabled in production. ' +
  `Create the first administrator from the command line with \`${CREATE_ADMIN_COMMAND}\` (see README, "Deployment").`

export const LAST_ADMIN_MESSAGE =
  'The last remaining administrator cannot be deleted. Give another user the admin role first.'

export const MIN_ADMIN_PASSWORD_LENGTH = 12

// ─── POST /api/users/first-register ───────────────────────────────────────────

export const firstRegisterEndpoint: Endpoint = {
  path: '/first-register',
  method: 'post',
  handler: async (req) => {
    // Checked before the body is read or the database is touched: in production this route never
    // creates anything, whether or not users exist.
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { errors: [{ message: FIRST_REGISTER_DISABLED_MESSAGE }] },
        { status: 403, headers: headersWithCors({ headers: new Headers(), req }) },
      )
    }

    await addDataAndFileToRequest(req)
    const collection = req.payload.collections[USERS]
    const body = (req.data ?? {}) as Record<string, unknown>
    // registerFirstUserOperation refuses (403) once any user exists.
    const result = await registerFirstUserOperation({
      collection,
      data: {
        ...body,
        email: typeof body.email === 'string' ? body.email : '',
        password: typeof body.password === 'string' ? body.password : '',
        // Never the caller's choice: the first account is the administrator.
        role: 'admin',
      } as Parameters<typeof registerFirstUserOperation>[0]['data'],
      req,
    })

    const cookie = generatePayloadCookie({
      collectionAuthConfig: collection.config.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
      token: result.token as string,
    })
    return Response.json(
      {
        exp: result.exp,
        message: req.t('authentication:successfullyRegisteredFirstUser'),
        token: result.token,
        user: result.user,
      },
      { status: 200, headers: headersWithCors({ headers: new Headers({ 'Set-Cookie': cookie }), req }) },
    )
  },
}

// ─── create-admin (boot flag / npm run create-admin) ──────────────────────────

/** Reads CREATE_ADMIN_EMAIL, CREATE_ADMIN_PASSWORD and CREATE_ADMIN_NAME. */
type CreateAdminEnv = Record<string, string | undefined>

export type CreateAdminResult =
  | { outcome: 'created'; email: string }
  | { outcome: 'skipped'; reason: string }
  | { outcome: 'failed'; reason: string }

/**
 * Creates the first administrator from CREATE_ADMIN_EMAIL / CREATE_ADMIN_PASSWORD /
 * CREATE_ADMIN_NAME. Does nothing unless `users` is empty. The password is never part of the
 * result or of any message, so callers can log the result as is.
 */
export async function createFirstAdmin(payload: Payload, env: CreateAdminEnv = process.env): Promise<CreateAdminResult> {
  const email = (env.CREATE_ADMIN_EMAIL ?? '').trim().toLowerCase()
  const password = env.CREATE_ADMIN_PASSWORD ?? ''
  const name = (env.CREATE_ADMIN_NAME ?? '').trim() || 'Administrator'
  // Anything this server later spawns inherits its environment — don't leave the password in it.
  if (env === process.env) delete process.env.CREATE_ADMIN_PASSWORD

  const redact = (text: string) => (password ? text.split(password).join('<redacted>') : text)

  try {
    const { totalDocs } = await payload.count({ collection: USERS, overrideAccess: true })
    if (totalDocs > 0) {
      return { outcome: 'skipped', reason: `the users table is not empty (${totalDocs} account(s)); nothing was changed` }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { outcome: 'failed', reason: 'CREATE_ADMIN_EMAIL is missing or not an email address' }
    }
    if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      return { outcome: 'failed', reason: `CREATE_ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters` }
    }

    await payload.create({
      collection: USERS,
      data: { email, password, name, role: 'admin' },
      overrideAccess: true,
    })
    return { outcome: 'created', email }
  } catch (err) {
    return { outcome: 'failed', reason: redact(err instanceof Error ? err.message : String(err)) }
  }
}

// ─── Users.hooks.beforeDelete ─────────────────────────────────────────────────

const PENDING_ADMIN_DELETES = 'pendingAdminDeletes'

/**
 * Blocks deleting the last remaining administrator. A bulk delete runs this hook for every
 * matched user concurrently, so the admins already cleared for deletion in the same request are
 * tracked on `req.context` and excluded from the "who is left" count — two admins deleted in one
 * request can't each see the other as the survivor.
 */
export const preventLastAdminDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const target = await req.payload.findByID({ collection: USERS, id, depth: 0, overrideAccess: true, disableErrors: true, req })
  if (!target || (target as { role?: string }).role !== 'admin') return

  const context = req.context as Record<string, unknown>
  const pending = (context[PENDING_ADMIN_DELETES] ??= new Set<number | string>()) as Set<number | string>
  pending.add(id)

  const { totalDocs: adminsLeft } = await req.payload.count({
    collection: USERS,
    overrideAccess: true,
    req,
    where: { and: [{ role: { equals: 'admin' } }, { id: { not_in: [...pending] } }] },
  })
  if (adminsLeft === 0) {
    pending.delete(id)
    throw new APIError(LAST_ADMIN_MESSAGE, 403, null, true)
  }
}
