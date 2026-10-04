# Security Remediation: S1–S8, N3

**Date:** 2026-10-01
**Basis:** `QA_AUDIT.md`, `QA_FINDINGS_P0.md`
**Status:** S1–S8 and N3 are committed on `master` (57c0058, 02ccab3, f9a85ed). S13, S14, S16 and S17 are committed on the branch `launch-hardening` (see "fourth pass" at the end).

Each fix was proven in two directions:
1. The new regression tests pass with the fix.
2. **Mutation check:** the fix was temporarily reverted. The security regression tests then **failed**, while the workflow and preservation tests still passed. The fix was then restored.

Pre-fix versions came from `git show HEAD` for files you had not changed. For files that already held your uncommitted work (`Experts.ts`, `Roadmaps.ts`, …), I reverted only the fix's lines in place from a backup, never with `git stash` or `git checkout`.

## Summary

| Finding | Root cause | Fix | Regression test | Result |
|---|---|---|---|---|
| **S1:** Expert private data exposed via REST | `Experts` had collection-level read only (`published` rows). No field-level `read` access, so every field went to anonymous callers. `showEmail`/`showPhone` were only checked in the React page | Field `read` access in `src/collections/Experts.ts`: `contactEmail`/`contactPhone` go to editor/board/admin, or to anyone when `showEmail`/`showPhone` is true. `consentOnFile`, `consentDate`, `verificationStatus` and `verifiedAt` go to editor/board/admin only. Payload then also refuses `where`/`count` on those paths (`400 "The following path cannot be queried"`) | `qa/security/s1-experts-exposure.test.ts` (16) | ✅ **Fixed.** Mutation: 7 security tests fail without the fix; 9 workflow/control tests pass either way |
| **S2:** Anonymous `POST /api/contact-submissions` | `access.create: () => true` exposed a REST write path that skipped the server action's checks. No `maxLength`, no consent rule, `status`/`submittedAt` client-controlled, no rate limit | **Collection:** `create: isEditorOrAbove`; `maxLength` (name 200, subject 200, category 100, message 5000); `consentGiven` must be `true` on create; a `beforeChange` hook forces `status: 'new'` and `submittedAt: now` on create and keeps `submittedAt` immutable on update. **Server action:** honeypot, per-IP rate limit (5 per 10 min), length/email/category/locale validation, explicit field whitelist. **Form:** honeypot, `maxLength` attributes, 2 new messages (de/en/ar) | `qa/security/s2-contact-submissions-public-create.test.ts` (16); `s5-s6-role-matrix.test.ts` (contact row) | ✅ **Fixed.** Mutation: 11 tests fail without the fix; 5 pass either way (behaviour the old action already got right) |
| **S3:** Hard-coded `PAYLOAD_SECRET` fallback | `secret: process.env.PAYLOAD_SECRET ?? 'INSECURE_DEV_SECRET_REPLACE_ME'` applied in every environment. Payload's own guard only rejects a falsy secret | New `src/lib/payloadSecret.ts` `resolvePayloadSecret()`. **In production:** throws if the secret is missing or empty, shorter than 32 chars, or a known placeholder (the old constant, the `.env.example` value). **Outside production:** unset still falls back to the dev-only constant. Called from `payload.config.ts` and, at boot, from `instrumentation.node.ts`. Messages never include the secret | `qa/security/s3-payload-secret.test.ts` (25): unit, static, `next dev` and **real `next build` + `next start`** | ✅ **Fixed.** Mutation: 7 tests (2 static + 5 production) fail without the fix |
| **S4:** Board emails public in SiteSettings | `SiteSettings.access.read: () => true`, with no field-level read access | Field `read` = admin/board on `boardNotificationEmails`, `submissionRetentionMonths` and `expertApplicationRetentionMonths`. A global `afterRead` hook removes the leftover `boardNotificationEmails: []` key on access-controlled reads only (`overrideAccess` false and not board/admin) | `qa/security/s4-site-settings-exposure.test.ts` (12) | ✅ **Fixed.** Mutation: 6 tests fail without the fix. Review emails still reach the SiteSettings recipients, verified with a local SMTP sink |
| **S5:** Viewer can delete Media / BoardMembers | `delete: isLoggedIn`, which includes the read-only `viewer` | `delete: isEditorOrAbove` on `Media` and `BoardMembers` | `qa/security/s5-s6-role-matrix.test.ts`: S5 block, plus exact per-role delete tests for all 5 actors | ✅ **Fixed.** Mutation: S5 tests and the affected matrix cells fail without the fix |
| **S6:** Viewer reads all unpublished content | `readPublishedOrLoggedIn` returned `true` for any authenticated user. `readVersions` was unset, so Payload's default (`Boolean(user)`) exposed the whole draft history | Renamed to **`readPublishedOrEditorPlus`**: editor/board/admin see everything, while viewer and anonymous get `reviewStatus = published`. Added `readVersions: isEditorOrAbove` to all 8 versioned collections | `qa/security/s5-s6-role-matrix.test.ts`: S6 block (per-status × per-role, `?draft=true`, `where`, `/versions`, populated relations) plus the matrix | ✅ **Fixed.** Mutation: 26 tests fail without the S5/S6 fix |

## S7 / S8 (second pass)

**S7: reproduced, fixed. S8: not reproduced; regression tests added anyway.**

| Finding | Root cause | Fix | Regression test | Result |
|---|---|---|---|---|
| **S7:** Editor publishing bypass on already-published documents | The reviewed collections had `update: isEditorOrAbove`, so editors could update *any* document. The only guard was the `enforceReviewStatusAccess` hook, which protects the `reviewStatus` *value*, not the document's content or live state | New access rule **`updateUnpublishedOrBoardPlus`** (`src/lib/access.ts`) on all 8 reviewed collections. Board/admin: all documents. Editors: a `where` constraint `reviewStatus not_in [published, archived]`. Because it is access control rather than a hook, it covers by-id PATCH (403), bulk PATCH (filtered out), `?draft=true` saves and version restores | `qa/security/s7-s8-review-workflow.test.ts`: 23 S7 regression tests plus 4 workflow-preservation tests | ✅ **Fixed.** 23 failed on the unchanged code; all pass with the fix |
| **S8:** Partial PATCH overwriting `_status` | **No defect.** The audit assumed collection `beforeChange` hooks see only the request body. A temporary probe (since removed) showed that in Payload 3.88 the hook's `data` already holds the full merged document (`reviewStatus` included), so `syncPublishStatus` derives `_status` correctly | None needed | Same file: 18 S8 tests (title, rich-text body, `featured`, excerpt, bulk PATCH, all 8 collections, draft / in_review / archived, explicit `reviewStatus`) | ✅ **Not reproduced.** All passed on the unchanged code; kept as regression guards |

**S7 reproduction on the unchanged code** (`qa/evidence/s7-prefix-reproduction.json`; editor vs. a published news item):

| Editor request | Response | Effect |
|---|---|---|
| Edit title only | 200 | Unreviewed title **went live** (anonymous API and `/de/nachrichten/<slug>`) |
| Edit + `reviewStatus=published` | 200 | **Went live** |
| Edit + `reviewStatus=archived` | 200 | The archive request was reset, but **the edit went live** |
| Edit + `reviewStatus=in_review` | 200 | Live item **taken offline** (anonymous 404) |
| "Save draft" (`?draft=true`) | 200 | Live content unchanged, but an unreviewed draft version was written over the published item |
| `reviewStatus=draft` on an archived item | 200 | Archived item **revived** to draft |

**After the fix:** every request above returns **403**. The database row stays `review_status=published`, `_status=published` (no new version row for the draft save), and both the anonymous API and the public page show the original content. The documented workflow still works:
- an editor's create with `reviewStatus=published` is stored as a draft;
- editors edit their drafts and submit them `in_review`, and the board email is sent;
- board/admin publish, and can edit live content directly.

**Behaviour intentionally changed (S7):**
- Editors can no longer modify **published or archived** documents in the 8 reviewed collections (news, events, services, guide-articles, roadmaps, experts, jobs, pages). That includes "suggesting" changes to live content via draft saves.
- Changing live content now needs board/admin, or board/admin moving the item back to draft first.
- In the admin panel, editors should see such documents read-only. Payload derives this from update access; **not verified in a browser**.

**Still open / related:**
- N3: editors could still **delete** jobs, including published ones. **Fixed in the third pass** (see "N3").
- Editor-proposed revisions of live content (draft over published, then board review) would need a deliberate design on top of Payload drafts. That was not built, as it isn't in the documented workflow.

**Test-harness defect found and fixed during this pass.** `embedded-postgres` registers `async-exit-hook`, whose `beforeExit` handler calls `process.exit(0)`. That overrode Vitest's failure exit code, so **a failing run still exited 0** and `test:all`'s `&&` did not stop. Its `exit` handler also crashed on shutdown (`done is not a function`), which the forced exit had masked. Fix: `qa/harness/postgres.ts` unhooks those two events (the signal handlers stay; teardown stops Postgres explicitly). Verified: a deliberately failing test now exits 1, a passing run exits 0.

All earlier results in this document and in `QA_FINDINGS_P0.md` were read from Vitest's test summaries, which were always accurate. Only the process exit code was wrong.

## N3: Jobs delete authorization (third pass)

**Reproduced, fixed.**

**Intended model, derived from the repository rather than assumed:**
- **Code pattern:** every other collection with the review workflow (news, events, services, guide-articles, roadmaps, experts, pages) has `delete: ({ req }) => req.user?.role === 'admin'`. `Jobs.ts` says it was modelled on News/Events deliberately and records no reason to differ.
- **`ADMIN-HANDBUCH.md` §2:** editors cannot publish; "every publication needs board approval". Deleting live content is the same bypass in reverse.
- **`BRIEF-AMENDMENT-01.md` §2.5:** expired postings are handled by the expiry filter and archiving, not deletion, so editors have no maintenance need to delete.
- **Result:** delete is admin only. Board takes a posting offline by **archiving** it (the documented route), which keeps working.

**Root cause:** `src/collections/Jobs.ts` had `delete: isEditorOrAbove`, the only reviewed collection not using admin-only delete. Deletion isn't an update, so the S7 update rule did not cover it.

**Reproduction on the unchanged code** (`qa/evidence/n3-prefix-reproduction.json`, `qa/evidence/n3-prefix-run.txt`):

| Actor | draft | in_review | published | archived | bulk (all 4) |
|---|---|---|---|---|---|
| anonymous | 403 | 403 | 403 | 403 | 403 (4 rows remain) |
| viewer | 403 | 403 | 403 | 403 | 403 (4 rows remain) |
| **editor** | **200, row deleted** | **200, deleted** | **200, deleted; public page → 404** | **200, deleted** | **200, 4 deleted** |
| **board** | **200, deleted** | **200, deleted** | **200, deleted; public page → 404** | **200, deleted** | **200, 4 deleted** |
| admin | 200, deleted | 200, deleted | 200, deleted | 200, deleted | 200, 4 deleted |

11 of 28 N3 tests failed on the unchanged code: all editor/board delete cases, plus the editor-workflow test's final "cannot delete" step.

**Fix:** `src/collections/Jobs.ts`: `delete: ({ req }) => req.user?.role === 'admin'`, the exact rule the other reviewed collections use. No other permission changed.

**Authorization matrix after the fix (verified):**

| Actor | DELETE `/api/jobs/:id` (draft / in_review / published / archived) | bulk DELETE `/api/jobs?where=…` |
|---|---|---|
| anonymous | 403, row kept | 403, rows kept |
| viewer | 403, row kept | 403, rows kept |
| editor | 403, row kept; a published job stays live | 403, rows kept |
| board | 403, row kept; a published job stays live | 403, rows kept |
| admin | 200, row and versions removed; a published job's page → 404 | 200, all matching rows removed |

**Regression tests:** `qa/security/n3-jobs-delete.test.ts` (28 tests).
- **By-id delete:** 4 review statuses × 5 actors = 20 tests. Each checks the HTTP status, the `jobs` row, the anonymous read, and for published jobs the public page `/de/stellenangebote/<slug>`.
- **Bulk delete:** 5 tests, one per actor.
- **Preserved operations, 3 tests:**
  - editor creates, edits and submits for review, but cannot delete;
  - board publishes, then takes the job offline by archiving (row kept, no longer public);
  - admin deletes a published job, and its row, versions and public page are gone.
- **Spec change:** the role matrix row `jobs.delete` moved from `editorPlus` to `adminOnly`.

**Result:** ✅ **Fixed.** All 28 pass, and the full suite passes (see below).

**Observation, not changed (unrelated permission):** `DECISIONS.md` (Experts "Removal path") says the *board* "deletes it outright via the admin panel", but Experts delete has always been admin-only in code. The documentation and the code disagree; one of them should be corrected by a product decision.

## Final test run

```bash
cd qa
npm run test:all      # = npm run test:p0 && npm run test:s3
cd ..
npm run typecheck
npm run lint
```

| Command | Result |
|---|---|
| `npm run test:p0` | **Test Files 6 passed (6) · Tests 369 passed (369)** |
| `npm run test:s3` | **Test Files 1 passed (1) · Tests 25 passed (25)** (includes a full production `next build`) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

Total: **394 tests**: 262 before remediation, 321 after S1–S6, 366 after S7/S8, 394 after N3. `test:all` exits 0, and a failing run exits 1 (see the harness defect above).

## Files changed

**Application** (each change marked `QA Sx` in a comment):
- `src/collections/Experts.ts`: S1, plus the S6 rename and `readVersions`
- `src/collections/ContactSubmissions.ts`: S2
- `src/lib/contactAction.ts`, `src/components/ui/ContactForm.tsx`, `src/messages/{de,en,ar}.json` (2 keys each): S2
- `src/lib/contactLimits.ts` (new): S2
- `src/lib/payloadSecret.ts` (new), `src/payload.config.ts`, `src/instrumentation.node.ts`: S3
- `src/globals/SiteSettings.ts`: S4
- `src/collections/Media.ts`, `src/collections/BoardMembers.ts`: S5
- `src/lib/access.ts` and `src/collections/{News,Events,Services,GuideArticles,Roadmaps,Jobs,Pages}.ts`: S6
- `next.config.ts`: `distDir: process.env.NEXT_DIST_DIR || '.next'`. This is test infrastructure for the S3 production build and has no effect unless the variable is set.

**QA:**
- **Test files:** `qa/security/*.test.ts`. Each finding's former "REPRODUCES" tests are inverted into "REGRESSION" tests on the same requests; nothing was removed or loosened.
- **New helpers:** `qa/harness/forms.ts` (submits the real server-action form like a browser without JavaScript) and `qa/harness/smtpSink.ts` (a local SMTP sink on 127.0.0.1 that records recipients).
- **Extended helpers:** `qa/harness/app.ts` (`next build` / `next start`), `globalSetup*.ts`.

## Behavior intentionally changed

1. **REST, experts:** anonymous and viewer callers no longer receive `contactEmail`/`contactPhone` (unless the matching `show*` flag is on), nor `consentOnFile`, `consentDate`, `verificationStatus` or `verifiedAt`. Filtering or sorting on those fields as a non-editor returns **400**. This also covers experts populated through relationships (for example `guide-articles.relatedExperts`).
2. **REST, contact submissions:**
   - Anonymous and viewer `POST` now returns **403**.
   - Editor-created submissions get `status: 'new'` and the server's `submittedAt`.
   - `submittedAt` can no longer be edited.
   - New length limits apply on every path.
   - `consentGiven: true` is required on create. Legacy rows stored without consent stay editable, because the rule is create-only.
3. **Contact form:**
   - A 6th message from the same IP within 10 minutes is refused ("Too many messages…").
   - An over-long field gets a "too long" message.
   - Unknown `category` values are stored empty and unknown `locale` values as `de` (the form only sends valid values, so normal users see no difference).
   - A hidden honeypot field was added.
4. **Production start and build:** both now **require** `PAYLOAD_SECRET` with at least 32 characters, not a placeholder. That includes `next build`, because Payload evaluates the config while prerendering. Your local `.env.local` secret (64 chars) already complies; this was checked without reading the value.
5. **Bad secret in production:** Next logs `Failed to prepare server … [config] PAYLOAD_SECRET is not set. Refusing to start in production…` and answers every request with **500**. The process does not exit.
6. **SiteSettings over REST:** anonymous, viewer and editor responses no longer include `boardNotificationEmails` or the two retention fields; the key is absent. Board and admin see them as before.
7. **Viewer role:** can no longer delete media or board members, and sees only published content and no version history. In practice viewer now has the same content visibility as an anonymous visitor (see Assumptions).
8. **Rename:** the access helper `readPublishedOrLoggedIn` is renamed to `readPublishedOrEditorPlus`. `isLoggedIn` is still exported but no longer used.

Unchanged and covered by tests:
- **Public website:** the expert page honours the show flags, the homepage renders, and the contact form succeeds through its server action.
- **Admin workflows:** editors read and filter expert private data; board verifies experts; board edits recipients; editors move inbox status; review notifications reach both the env and SiteSettings recipients.
- **Non-production:** with `PAYLOAD_SECRET` unset, the dev fallback works exactly as before.

## Still needs verification

- **Admin panel UI as viewer and editor.** Access is enforced server-side and fully covered over REST, but no browser test opens `/admin` as each role. A short manual pass is advisable, for example: the viewer's admin lists now show only published items; the editor's expert form still shows contact fields.
- **Contact form in `ar`/`en`.** Tests submit the German form. The action is locale-independent and the messages exist in all three files, but no test renders them in `ar`/`en`.
- **Rate limiting in the real deployment.** The limiter is in-memory per instance and keyed on the first `X-Forwarded-For` value (QA_AUDIT S11). It only holds if the hosting platform overwrites that header and runs a single instance. On Vercel, or behind several instances, it needs a shared store (Redis/Upstash) to be reliable. The tests themselves rely on setting `X-Forwarded-For`.
- **Bad-secret startup does not exit the process.** Orchestrators (Docker/systemd) will not see a crash, only 500s. A health check on `/api/users/init` would catch it. Forcing `process.exit(1)` is possible but was left out as a larger behaviour change.
- **CI/preview builds** must now provide `PAYLOAD_SECRET`.
- **Existing production data:** any submissions created through the old public REST route (`consentGiven: false`, back-dated `submittedAt`, `status: archived`) are still in the database and should be reviewed.

## Remaining open findings from QA_AUDIT.md (not addressed here)

| ID | Finding | Status |
|---|---|---|
| S7 | Editor edits to an already-published document go live without review | **Fixed** (second pass, above) |
| S8 | A partial `PATCH` without `reviewStatus` may unpublish | **Not reproduced**; regression-guarded (second pass, above) |
| S9 | Unescaped HTML in the contact-forward and board-notification emails | **Open.** The email template in `contactAction.ts` was deliberately left unchanged (out of scope) |
| S10 | Contact form had no rate limit or honeypot | **Addressed by S2** (in-memory limit; see S11) |
| S11 | In-memory, XFF-keyed rate limiter (expert form and now contact form) | Open |
| S12 | No app-level length limits | Contact form **addressed**; expert application still relies on Payload's 40,000-char default |
| S13 | Missing security headers (CSP, HSTS, frame-ancestors) | **Fixed** (fourth pass, below) |
| S14 | Anonymous first-user registration on an empty DB | **Fixed** (fourth pass, below) |
| S15 | Unbounded `limit`/`depth`/`where` on public REST | Open |
| S16 | Expert `website` URL scheme not validated | **Fixed** (fourth pass, below) |
| S17 | JSON-LD `</script>` break-out (editor-controlled content) | **Fixed** (fourth pass, below) |
| S18 | `GET /api/media` lists every upload publicly | Open |
| S19 | GDPR retention settings not enforced | Open |
| S20 | Unverified experts can be published (by design, warning only) | Open / product decision |
| N1 | Server-side session expiry not enforced; expired sessions pruned only at next login | Open (Payload behaviour; still demonstrated in the S3 dev block) |
| N2 | Anonymous create echoed the stored document | **Moot.** Anonymous create is closed |
| N3 | Editors (and board) could delete jobs, including **published** jobs | **Fixed** (third pass, above) |
| P1–P10 | Performance items (DB pool, search, error caching, cache invalidation, indexes, …) | Open |

## Assumptions

1. **Viewer semantics.** Viewer is a read-only role with the same content visibility as the public (published only), plus read access to the admin panel. QA_AUDIT documents viewer as read-only, and you said logging in must not unlock drafts. If viewer is meant to preview drafts, the right fix is a separate role, not loosening `readPublishedOrEditorPlus`.
2. **Media/BoardMembers delete stays with editor+** (the smallest change that removes viewer). The alternative from QA_AUDIT, admin-only, would also remove the right from editors and board, so I did not choose it.
3. **Editors may read expert private data**, because they process applications. Viewers may not.
4. **The retention settings count as private** together with the board addresses. They are internal configuration; the S4 verification already flagged them; nothing public reads them.
5. **Limits:**
   - Contact field lengths: name 200, email 254, subject 200, category 100, message 5000.
   - Rate limit: 5 per 10 minutes per IP.
   - Minimum production secret length: 32. That matches what `.env.example` already asks for.
6. **Dev fallback continuity.** The dev-only fallback keeps the old constant's value so existing dev sessions keep working. It is on the production denylist.
7. **Unchanged semantics outside production:** an explicitly empty `PAYLOAD_SECRET=""` still yields Payload's "missing secret key" error rather than the fallback.
8. **Failure mode:** "fail clearly and safely" in production is met by Next refusing to prepare the server (logged, all requests 500), not by exiting the process.

## S13, S14, S16, S17 (fourth pass, 2026-10-04)

Branch `launch-hardening`. Each fix was mutation-checked the same way as the earlier passes: the
fix reverted, the new regression tests run, the failures recorded, the fix restored.

| Finding | Root cause | Fix | Regression test | Mutation check |
|---|---|---|---|---|
| **S14:** anonymous first-user registration | Payload's built-in `POST /api/users/first-register` creates the first account, with a caller-chosen role, for whoever calls it on an empty `users` table | `src/lib/firstAdmin.ts`. A custom `/first-register` endpoint on `Users` (custom endpoints are matched before Payload's own): **production → always 403** with a message naming `npm run create-admin`; outside production it stays open, role forced to `admin`. `CREATE_ADMIN_ON_BOOT=1` (`src/instrumentation.node.ts`, set by `npm run create-admin`) creates an admin only when `users` is empty and never logs the password. A `beforeDelete` hook refuses to delete the last remaining admin, also when one bulk request matches several admins | `qa/security/s14-first-admin.test.ts` (15): dev server and a real production build, including six concurrent first-register calls that must leave 0 users. The S3 production test now creates its admin through the boot flag | Endpoint + hook removed: 13 of 15 fail. Hook only removed: the 5 last-admin tests fail |
| **S16:** expert `website` URL scheme | The value from the public application form was stored and rendered as `href` unchecked | `src/lib/safeUrl.ts`, two layers. **Storage:** `validate` on the `Experts.website` field (http, https, mailto only) — covers REST, admin and the form's Local API call; the form action rejects it first and turns `www.example.org` into an https URL. **Render:** the expert page emits the link only when `safeExternalUrl` accepts the stored value | `qa/security/s16-s17-urls-jsonld.test.ts`: 12 unsafe values × (helper, REST create, rendered page with the value written straight into the database), update as admin/board/editor, the real public form, 4 valid values | Validation, action check and render check reverted: every storage, form and render test fails |
| **S17:** JSON-LD `</script>` break-out | 16 call sites wrote `JSON.stringify(...)` into `<script type="application/ld+json">` via `dangerouslySetInnerHTML`; a title containing `</script>` ends the data block | One serializer, `serializeJsonLd` (`src/lib/jsonld.ts`), escaping `<`, `>`, `&`, U+2028, U+2029, behind one component, `<JsonLd>` (`src/components/ui/JsonLd.tsx`), used by all eight pages | Same file: documents with the payload in their titles are created through the API and the eight public pages are fetched — no raw break-out anywhere in the HTML, the expected number of JSON-LD blocks, each parses and still carries the exact title. Static tests: the component is the only emitter | Escaping removed: the helper test and all 8 rendered-page tests fail |
| **S13:** missing security headers | Only `nosniff` and `Referrer-Policy` were set | `next.config.ts`: `X-Frame-Options`, `Permissions-Policy`, HSTS (production only) on everything; an **enforced** CSP on the public site; on `/admin` the full policy as `Content-Security-Policy-Report-Only` plus an enforced `frame-ancestors 'self'`; `/api` and `/media` get `frame-ancestors 'self'` | `qa/security/s13-security-headers.test.ts` (dev server) and `qa/security/prod-build.test.ts` (production build: HSTS, no `unsafe-eval`, and the admin panel still loading, logging in, saving a document and uploading an image) | Dev tests run against the unchanged `next.config.ts` first: see `qa/evidence/run-s13-prefix.txt` |

**Behaviour intentionally changed**
- A production build answers `POST /api/users/first-register` with 403 whatever the state of the
  database. `/admin/create-first-user` still renders on an empty production database but cannot
  create anything; the error names the command.
- The last remaining administrator cannot be deleted (403).
- An expert `website` that is not an absolute http, https or mailto URL is rejected on save (400) and
  in the public form; existing rows with such a value keep it but no longer render a link, and
  cannot be saved again until it is corrected.
- JSON-LD output is byte-different (`<` → `<` …) and semantically identical.
- The public site sends an enforced Content-Security-Policy. Anything loaded from another origin
  in future (a map, a video embed, analytics) must be added to it in `next.config.ts`.

**QA harness changes** (no test was removed or loosened)
- Every harness boot compiles into its own `qa/.tmp/next-*` directory; nothing touches `.next`.
- The embedded Postgres is initialised as UTF-8, like production. It used the Windows code page
  before, which cannot store U+2028 or Arabic text.
- One production build per run is shared by the S3, S14 and production-header files.

**Still open from `QA_AUDIT.md`:** S9, S11, S12 (expert form), S15, S18, S19, S20, N1, P1–P10.
`LAUNCH-CHECKLIST.md` lists which of these block a public launch.

**Test run after the fourth pass**

| Command | Result |
|---|---|
| `npm run test:p0` | **Test Files 10 passed (10) · Tests 499 passed (499)** (including S21, below) |
| `npm run test:s3` | **Test Files 3 passed (3) · Tests 53 passed (53)** (S3, S14 and the production-build file; one shared `next build`) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

Total: **552 tests** (394 before this pass).

## S21: anonymous read and bulk update of `users` (found in the fifth-phase review, 2026-10-04)

Not in `QA_AUDIT.md`; `users` was never part of the role matrix. Found by the independent security
review against the production build, reproduced on the disposable database, fixed.

| | |
|---|---|
| **Root cause** | `isAdminOrSelf` (`src/lib/access.ts`) ended in `req.user?.id === id`. A list or bulk request has no `id`, an anonymous one no user: `undefined === undefined`, so `read` and `update` on `users` were granted to anyone |
| **Effect on the unfixed code** | `GET /api/users` returned every account with email and role. An anonymous bulk `PATCH /api/users?where[id][equals]=…` with `{ "password": … }` answered 200; afterwards the old password was rejected and the attacker's accepted (`qa/evidence/s21-anonymous-password-overwrite.json` from the pre-fix run: `attackStatus 200, oldPassword 401, attackerPassword 200`) |
| **Fix** | No user → `false`; admin → `true`; anyone else → the constraint `id = own id`, which holds for by-id, list and bulk operations alike |
| **Regression test** | `qa/security/s21-users-access.test.ts` (20): six anonymous list/count variants, by-id, the password overwrite, a bulk rename of every admin, and for viewer / editor / board that they see and change only themselves; admin keeps full access |
| **Mutation check** | Run against the unfixed code first: 11 of 20 fail (`qa/evidence/run-s21-prefix.txt`) |
| **Behaviour changed** | Anonymous `GET /api/users` and bulk `PATCH` now answer 403. A signed-in non-admin listing users gets their own account (it was 403 before) |

**If any earlier build was ever reachable from the internet, treat the accounts as compromised** —
see `LAUNCH-CHECKLIST.md` section 0.
