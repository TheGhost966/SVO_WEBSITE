# QA Phase 0 + Phase 1 (P0): Verified Findings

**Date:** 2026-10-01
**Basis:** `QA_AUDIT.md` (findings S1–S6)
**Scope:** reproduce and verify only. **No application code was changed and nothing was fixed.**

## Test environment

| Item | Value |
|---|---|
| Database | Disposable **embedded PostgreSQL 17.10** (`embedded-postgres`), `127.0.0.1:54329`, data in `qa/.tmp/pg`, deleted at teardown. A hard guard (`qa/harness/safety.ts`) refuses any `DATABASE_URI` that is not local, on port 54329, and named `svo_qa_*`. |
| Schema | Built from the repo's own migrations, by booting the app once with `PAYLOAD_MIGRATE_ON_BOOT=1` against `svo_qa_template`. **All 9 migrations (including the 3 untracked ones) applied cleanly to an empty DB**, verified against `payload_migrations`. Each suite clones the template. |
| App | `next dev` on `127.0.0.1:3100` (P0 suite) and `:3101` (S3 suite), started with **`NODE_ENV=test`**. In test mode `@next/env` skips `.env.local`, so the real Neon URL and SMTP credentials were never loaded (confirmed: no "Environments: .env.local" line in any server log). Every app env var is also set explicitly by the harness. |
| Email | SMTP points at `127.0.0.1:1`; sends fail with `ECONNREFUSED`, so no mail can leave the machine. |
| Tokens | Every token (including the forged ones in S3) was minted only for QA users inside the disposable database. **No real environment was contacted.** |
| Test style | Black-box HTTP tests (Vitest 3.2) against the running app. Seed data is created over REST as the QA admin. |
| Not changed | App code, app `package.json`/lockfile, tsconfig, Payload config. QA tooling lives in its own `qa/` package. `next dev` rewrites `tsconfig.json` on boot (an extra `include` entry). The harness snapshots `tsconfig.json` and `next-env.d.ts` and restores them at teardown (verified byte-identical after a full run). |

Raw evidence is regenerated on every run in `qa/evidence/` (gitignored): JSON per check, `role-matrix.md`, and the server logs.

### Run commands
```bash
cd qa
npm install          # first time only: vitest, embedded-postgres (downloads Postgres binaries)
npm run test:p0      # S1, S2, S4, S5/S6 — 253 tests, ~45 s
npm run test:s3      # S3 — 9 tests, ~35 s (boots its own app variants)
npm run test:all     # both, sequentially
```

### Result of the final run
```
test:p0  Test Files 4 passed (4)   Tests 253 passed (253)
test:s3  Test Files 1 passed (1)   Tests   9 passed (9)
```
App `npm run typecheck` and `npm run lint` still pass with `qa/` present.

### How to read the tests
Tests prefixed **`REPRODUCES Sx`** are characterization tests: they assert today's (insecure) behaviour exactly. **When a finding is fixed, those tests are meant to fail.** The fix must then replace them with the "Expected behavior" assertion below; it must not loosen them. **`control:`** tests prove the boundaries that do work, so a fix can't regress them.

---

## S1: Experts' private contact data exposed via the REST API

**Finding:** Anonymous callers receive the private contact and consent data of every published expert, regardless of `showEmail`/`showPhone`. They can also search and filter on those hidden fields.

**Endpoint/component:**
- `GET /api/experts`, `GET /api/experts/:id`, `GET /api/experts/count`
- `src/collections/Experts.ts`: `access.read = readPublishedOrLoggedIn`, no field-level `read` access

**Current behavior:**
- **Fields returned:** an anonymous list or by-id response returns all 22 fields of a published expert: `_status, bio, bundesland, categories, city, consentDate, consentOnFile, contactEmail, contactPhone, createdAt, id, languages, name, photo, reviewStatus, showEmail, showPhone, slug, updatedAt, verificationStatus, verifiedAt, website`.
- **Hidden values exposed:** with `showEmail=false` and `showPhone=false`, the response still contained `contactEmail`, `contactPhone`, `consentDate`, `consentOnFile: true` and `verificationStatus: "unverified"`.
- **Search oracle:** `where[contactEmail][like]` (full or partial), `[equals]`, `where[contactPhone][like]` and `where[contactEmail][like]=@test.invalid` (domain) each returned the matching expert. `/api/experts/count?where[…]` answers yes/no without returning documents.
- **`?select`:** `?select[contactEmail]=true` returns just the private field.

**Expected behavior:**
- `contactEmail` and `contactPhone` are never returned to anonymous callers unless the matching `show*` flag is true.
- `consentDate`, `consentOnFile`, `verificationStatus` and `verifiedAt` are never returned to anonymous callers.
- `where`/`sort` on those fields is rejected or ignored for anonymous callers.

**Reproduction:**
```
GET /api/experts?depth=0&limit=100                                   (no auth)
GET /api/experts?where[contactEmail][like]=private-published         (no auth)
GET /api/experts/count?where[contactEmail][like]=private-published   (no auth)
```

**Evidence:**
- `qa/evidence/s1-experts-list-anonymous.json`: field list and values above.
- `s1-experts-where-oracle-anonymous.json`: every probe returned `totalDocs: 1`; the miss returned `0`; count returned `{"totalDocs":1}`.
- `s1-expert-page-html-check.json`: the public page `/de/experten/<slug>` does **not** contain the email or phone. The UI toggle works; only the API leaks.
- Controls (`s1-experts-unpublished-control.json`): draft, in-review and archived experts are not reachable anonymously. By-id returns 404, including with `?draft=true`; `where` returns 0 hits.

**Test file:** `qa/security/s1-experts-exposure.test.ts` (6 tests)
**Severity:** **High.** Third-party personal data (GDPR, Art. 5/25), retrievable in bulk without authentication.
**Status:** ✅ **Reproduced.**

---

## S2: Anonymous REST create on `contact-submissions`

**Finding:** `POST /api/contact-submissions` is open to anyone and bypasses every check in the contact-form server action.

**Endpoint/component:**
- `POST /api/contact-submissions`
- `src/collections/ContactSubmissions.ts` (`access.create: () => true`; no field access, no `maxLength`, no hooks)
- `src/lib/contactAction.ts` is skipped entirely.

**Current behavior:**

| Probe | Result |
|---|---|
| Create anonymously | **201**. The created document is echoed back to the anonymous caller, although anonymous read is 403 |
| `consentGiven: false` | **201**, stored `false` |
| `consentGiven` omitted | **201**, stored `false`. `required` on a checkbox only means "is a boolean", and an omitted checkbox reaches validation as `false` |
| `message: "x"` (form requires ≥ 10 chars) | **201** |
| 40,000 chars in each of name/subject/category/message (~160 KB) | **201**, all stored in full |
| 40,001 chars, or a 1 MB message | **400**, from Payload's global `defaultMaxTextLength` (40,000) |
| `status: "archived"`, `submittedAt: "2000-01-01T00:00:00.000Z"` | **201**, both stored as sent (hidden from the inbox, back-dated) |
| 30 back-to-back submissions | **30 × 201**, no 429 |
| Control: anonymous list / read by id | 403 / 403 |

**Expected behavior:**
- Either there is no public REST create (submissions only through the server action, using the Local API with an explicit field whitelist, as `submitExpertApplication` already does), or the collection enforces the same rules as the form:
  - consent must be `true`;
  - the message must be at least 10 characters;
  - `status` and `submittedAt` are server-set;
  - fields have sensible `maxLength` values;
  - requests are rate limited.

**Reproduction:**
```
POST /api/contact-submissions  {"name":"x","email":"a@b.c","message":"x"}                       → 201
POST /api/contact-submissions  {…,"consentGiven":true,"status":"archived","submittedAt":"2000-01-01T00:00:00.000Z"}  → 201
```

**Evidence:** `qa/evidence/s2-contact-submissions-anonymous.json`. Stored values were read back as the QA admin.

**Test file:** `qa/security/s2-contact-submissions-public-create.test.ts` (9 tests)
**Severity:** **High.** Unauthenticated, unthrottled writes. Inbox poisoning, consent records that can be falsified (GDPR accountability), and DB growth of ~160 KB per request.
**Status:** ✅ **Reproduced**, with one part not reproduced (below).

**Corrections to QA_AUDIT.md:**
- **Unbounded input is not reproduced.** QA_AUDIT S2/S12 said there were "no length limits". In fact Payload's default `defaultMaxTextLength: 40000` (payload/dist/config/defaults.js) caps every text and textarea field. The app sets no limits of its own; the effective cap is 40,000 chars per field.
- **Omitted consent is accepted.** I first wrote that test expecting a 400, based on reading the checkbox validator alone. The run returned 201 and stored `false`. The test now asserts the observed behaviour. This was an authoring error on my part, not a loosened assertion: no correct test was changed to pass.

---

## S3: `PAYLOAD_SECRET` falls back to a constant committed to the repo

**Finding:** With `PAYLOAD_SECRET` unset, the app starts normally and signs every session JWT with `'INSECURE_DEV_SECRET_REPLACE_ME'`. Anyone who has seen *any* token for a session (its `sid` is readable in the JWT payload) can mint a working token for that session with an expiry of their choosing.

**Endpoint/component:**
- `src/payload.config.ts:40`: `secret: process.env.PAYLOAD_SECRET ?? 'INSECURE_DEV_SECRET_REPLACE_ME'`
- Payload JWT strategy (`payload/dist/auth/strategies/jwt.js`)

**Current behavior:**

| Question | Answer |
|---|---|
| What happens when `PAYLOAD_SECRET` is missing? | The fallback constant is used silently. `/api/users/init` returns 200 and login works |
| Is production startup prevented? | **No.** `PAYLOAD_SECRET` is read in exactly one place in `src/` (`payload.config.ts:40`), with no `NODE_ENV` check and no `throw`. Payload's own guard (`payload/dist/index.js:319`) only rejects a *falsy* secret, and the `??` fallback is never falsy |
| Is the fallback actually used? | **Yes.** The token the server issued verifies under `sha256('INSECURE_DEV_SECRET_REPLACE_ME').hex[0:32]`, Payload's key derivation, and not under any other key |
| Is a forged JWT accepted? | **Yes, if it carries a valid `sid`.** A token forged with the fallback key, the admin's `sid` and `exp = now + 10 years` was accepted by `/api/users/me` as the admin |
| Is a forged JWT accepted *without* a valid sid? | **No.** Payload's default `useSessions: true` rejected no sid, a random sid, another user's id with the admin's sid, and the wrong key |
| Can an *expired* session be revived? | **Yes.** Back-dating the session row 30 days (expired but not yet pruned) still accepted the forged token. Payload checks only that the `sid` exists, and prunes expired sessions only on the user's next login |
| After logout? | The forged token is rejected, because the session row is deleted |
| `PAYLOAD_SECRET=""` (empty string) | `??` keeps `""`. The server still starts, but every Payload request returns **500** "missing secret key". Fails closed, but noisily |

**Expected behavior:**
- The app refuses to start (throws during config load) when `PAYLOAD_SECRET` is missing, empty or shorter than about 32 characters, at least when `NODE_ENV=production`.
- No secret literal exists in source.

**Reproduction:** Run `npm run test:s3`. It boots the app with `PAYLOAD_SECRET` unset against a disposable database, creates a QA admin, decodes the issued JWT, and re-signs it with the fallback-derived key.

**Evidence:** `qa/evidence/s3-payload-secret.json` (`unsetStartup`, `issuedTokenClaims`, `forgedWithKnownSid.accepted: true`, `forgedWithoutValidSession: all rejected`, `expiredSession.forgedAccepted: true`, `afterLogout.forgedAccepted: false`, `emptySecret.initStatus: 500`); logs in `qa/evidence/logs/s3-secret-*.log`.

**Test file:** `qa/security/s3-payload-secret.test.ts` (9 tests)
**Severity:** **High (conditional).** It applies only if a deployment is missing the env var, but then it means full admin takeover from any leaked or old token (logs, browser history, a former editor), with no expiry. Payload's session check is the only barrier; it is real, and it limits the attack to holders of a `sid`.
**Status:** ✅ **Reproduced** in `next dev` (`NODE_ENV=test`). ⚠️ **Not exercised under `next build && next start` (`NODE_ENV=production`)**; see "further verification".

---

## S4: SiteSettings global exposes private fields anonymously

**Finding:** `GET /api/globals/site-settings` returns every field to anonymous callers, including board members' notification addresses and the GDPR retention configuration.

**Endpoint/component:**
- `GET /api/globals/site-settings`
- `src/globals/SiteSettings.ts` (`access.read: () => true`, no field-level read access)

**Current behavior:**
- **200 with all top-level keys:** `id, logo, logoAlt, orgName, tagline, contactGroup, socialLinks, seoGroup, jobResourceLinks, homeGroup, submissionRetentionMonths, expertApplicationRetentionMonths, boardNotificationEmails, updatedAt, createdAt, globalType`.
- **Board addresses:** `boardNotificationEmails: [{ email: "qa-board-settings-private@test.invalid" }]` is present.
- **Retention settings:** `submissionRetentionMonths: 12` and `expertApplicationRetentionMonths: 6` are present.
- **All locales:** the same data is returned for `de`, `ar`, `en` and `locale=all`.
- **Control:** an anonymous update returns 403.

**Expected behavior:**
- `boardNotificationEmails` (and the retention settings, which are internal configuration) have field-level `read` limited to admin/board.
- The public site keeps working, since it reads settings through the Local API.

**Reproduction:** `GET /api/globals/site-settings?depth=0` without auth.

**Evidence:** `qa/evidence/s4-site-settings-anonymous.json` (full body and key list)

**Test file:** `qa/security/s4-site-settings-exposure.test.ts` (4 tests)
**Severity:** **Medium.** QA_AUDIT rated this High; I'm revising it down. It exposes personal addresses of board members, which enables targeted phishing that impersonates the site's "review" notification email, but no credentials or bulk data.
**Status:** ✅ **Reproduced.**

---

## S5: The read-only `viewer` role can delete Media and Board Members

**Finding:** `delete: isLoggedIn` on `media` and `board-members` lets any authenticated user delete, including the viewer role, which can't create or update anything.

**Endpoint/component:**
- `DELETE /api/media/:id` and `DELETE /api/board-members/:id`
- `src/collections/Media.ts`, `src/collections/BoardMembers.ts`

**Current behavior:**
- **Delete allowed:** viewer `DELETE /api/media/:id` returns **200**, and the admin's subsequent read returns **404**, so the delete really happened. The same applies to board-members.
- **Create/update denied:** viewer create and update on both collections return 403.
- **Control:** viewer deletes on news, experts, jobs and contact-submissions return 403.

**Expected behavior:** Delete on both collections is limited to admin (or `isEditorOrAbove`, if editors are meant to manage media). The viewer gets 403.

**Reproduction:** Log in as a viewer, then `DELETE /api/media/<id>`.

**Evidence:** `qa/evidence/s5-viewer-delete-media.json` (`deleteStatus: 200, adminReadAfter: 404`), `s5-viewer-delete-board-members.json`, and the `media` / `board-members` tables in `qa/evidence/role-matrix.md`.

**Test file:** `qa/security/s5-s6-role-matrix.test.ts` (S5 block, plus the matrix)
**Severity:** **Medium.** It is destructive: deleting media breaks images site-wide, and there is no versioning on media. The attacker needs a viewer account.
**Status:** ✅ **Reproduced.**

---

## S6: Any logged-in user, including `viewer`, reads all unpublished content

**Finding:** `readPublishedOrLoggedIn` returns `true` for every authenticated user. The viewer role therefore sees every draft, in-review and archived document, and the full version history.

**Endpoint/component:**
- `GET /api/{news,events,services,guide-articles,roadmaps,experts,jobs,pages}` (list and by id) and `GET /api/{collection}/versions`
- `src/lib/access.ts`

**Current behavior:**
- **Drafts readable:** for all 8 reviewed collections, the viewer gets 200 by id for `draft`, `in_review` and `archived` documents, and they appear in the list.
- **Filtering for unpublished:** `where[reviewStatus][not_equals]=published` returns exactly `archived`, `draft` and `in_review`.
- **Version history:** `GET /api/news/versions` returns 200 for the viewer (20 versions) and 403 for anonymous callers.
- **Unpublished experts:** for experts this includes the private contact data of unpublished applications.
- **Control:** anonymous callers get 404 for every unpublished document, including with `?draft=true`.

**Expected behavior:** This depends on what "viewer" is for, which is a product decision.
- If viewer means "read the public site's content only", it gets `reviewStatus = published`, the same as anonymous.
- If it means "read-only access to the admin panel", reading drafts may be intended. In that case S6 is **by design**, and the only defect is the S5 delete.

The decision should be written down, and the matrix updated to match.

**Reproduction:** Log in as a viewer, then `GET /api/news?where[reviewStatus][not_equals]=published`.

**Evidence:** `qa/evidence/s6-viewer-unpublished-*.json` (one per collection), `s6-versions-access.json`, `role-matrix.md`.

**Test file:** `qa/security/s5-s6-role-matrix.test.ts` (S6 block, plus the matrix)
**Severity:** **Medium.** Low to Medium if viewer is meant as admin-read-only.
**Status:** ✅ **Reproduced.** ⚠️ The intended semantics of the viewer role need a product decision.

---

## Full role matrix (S5/S6)

**395 cells** (11 collections × 5 actors × list, read-by-id per review status, create, update, delete), **0 mismatches**. **Every observed cell matches the access rules currently in `src/collections/*.ts` (QA_AUDIT §4.2); there are no unexpected allows or denies.** The generated table is in `qa/evidence/role-matrix.md`. Summary:

| Collection | anonymous | viewer | editor | board | admin |
|---|---|---|---|---|---|
| media, board-members | read | read, **delete** | CRUD | CRUD | CRUD |
<!-- C = create, R = read, U = update, D = delete -->
| news, events, services, guide-articles, roadmaps, experts, pages | read published | **read all** | read all, C, U | read all, C, U | CRUD |
| jobs | read published | **read all** | **CRUD** (incl. delete) | CRUD | CRUD |
| contact-submissions | **create** | **create** | R, C, U | R, C, U | CRUD |

---

## Incidental findings (observed while testing, outside S1–S6)

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| S14 (QA_AUDIT) | **Confirmed:** on an empty `users` table, anonymous `POST /api/users/first-register` creates an admin (caller-chosen role) and returns a token. The harness relies on this to seed. | `qa/evidence/p0-fixtures.json` (`firstRegister.status: 200`, `bodyKeys` include `token`) | Medium (fresh deployments only) |
| N1 | Server-side session expiry is not enforced on requests. A session row with `expires_at` in the past still validates both the legitimate token (until its own `exp`) and forged ones. Expired sessions are only pruned on the next login. | `s3-payload-secret.json` → `expiredSession` | Low on its own; aggravates S3 |
| N2 | The anonymous `POST /api/contact-submissions` response echoes the full stored document back. | `s2-…json` → `create.responseBody` | Info |
| N3 | Jobs `delete` is `isEditorOrAbove`, while every other reviewed collection is admin-only. Confirmed at runtime (editor delete returns 200). | `role-matrix.md` → `jobs` | Low (consistency) |

---

## Summary

### 1. Reproduced
- **S1:** experts' contact and consent data via REST, plus the `where`/`count`/`select` oracle.
- **S2:** anonymous create; consent false *or omitted*; short message; caller-set `status` and `submittedAt`; no rate limit (30/30 accepted); 40,000 chars per field.
- **S3:** fallback secret silently used; no startup guard; forged JWT accepted with a known `sid`, including from an expired session.
- **S4:** `boardNotificationEmails` and the retention settings returned anonymously.
- **S5:** viewer deletes media and board members.
- **S6:** viewer reads draft, in-review and archived content in all 8 collections, plus version history.
- **Incidental:** S14 (open first-register), N1, N2, N3.

### 2. Not reproduced
- **S2/S12 "unbounded/oversized input":** Payload's default `defaultMaxTextLength` rejects anything over 40,000 chars per field (40,001 chars → 400; 1 MB → 400). Length is bounded, although not by the app.
- **S3 "any forged JWT is accepted":** forged tokens without a valid session id are rejected (Payload `useSessions`). Exploitation needs a `sid` from some previously issued token.

### 3. Require further verification
- **S3 under a production build** (`next build && next start`, `NODE_ENV=production`). Not run, because it needs a separate build. Static evidence shows no `NODE_ENV`-dependent code path, so the outcome is expected to be identical.
- **S6 intent:** a product decision on what the viewer role is for.
- **GraphQL:** no `/api/graphql` route file exists. Not probed in this phase; a one-line check that it returns 404 belongs in the next pass.
- **Deployment-level protections** (WAF, a proxy-level rate limit, an `x-forwarded-for` overwrite) can't be judged until a deployment target exists.
- Out of scope for this phase and still open from QA_AUDIT: **S7/S8** (editor publish bypass, partial-PATCH unpublish), S9–S11, S13, S15.
