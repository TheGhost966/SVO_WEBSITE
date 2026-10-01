# QA Audit — SVÖ Website

**Date:** 2026-10-01
**Scope:** Read-only inspection of the working tree on `master` (HEAD `065f8ba`, plus uncommitted changes: Jobs, Quiz, Search, AppBand, three new migrations).
**Nothing in the application was changed.** The only checks I ran were `tsc --noEmit` (exit 0) and `eslint .` (exit 0).

Findings marked **[Confirmed]** come straight from reading the code. Findings marked **[Verify]** depend on Payload runtime behaviour and need a test to confirm before anyone fixes them.

---

## 1. Architecture overview

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16.3.4** (App Router, Turbopack) | `src/proxy.ts` replaces `middleware.ts` (Next 16 convention) |
| CMS / backend | **Payload CMS 3.88.0** running inside the Next.js process | No separate backend service |
| Database | **PostgreSQL** via `@payloadcms/db-postgres` (Drizzle) | `.env.local` notes Neon. Pool `max: 20`. `push: false`, so schema changes go through migrations only |
| i18n | `next-intl` 4.14.2 + Payload localization | Locales `de` (default), `ar` (RTL), `en`. `localePrefix: 'always'`. German URLs are localized (`/de/nachrichten`, …). Payload `fallback: true` falls back to `de` |
| Rich text | Lexical (`@payloadcms/richtext-lexical`) | Rendered by `components/ui/LexicalContent.tsx` |
| Email | Nodemailer SMTP adapter | Used for contact-form forwarding, board review notifications and Payload auth mail (forgot password) |
| Media storage | Local disk `public/media`, **or** Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (`clientUploads: true`) | Images processed with `sharp` (thumbnail/card/hero) |
| Styling | Tailwind CSS 4 | Self-hosted fonts in `public/fonts` |
| Cookie consent | `vanilla-cookieconsent` 3 | `components/ui/CookieConsent.tsx` |
| Caching | `unstable_cache` with tags plus `revalidateTag` from Payload hooks (`src/hooks/revalidateOnPublish.ts`) | TTLs range from 60 s to 3600 s |
| Migrations / seed | Run at server boot from `src/instrumentation.node.ts`, controlled by env flags | The Payload CLI cannot load the config under tsx (see DECISIONS.md "Known issues") |

### Request flow
```
Browser ─► src/proxy.ts (next-intl locale redirect; skips /api, /admin, /_next, files)
        ├─► /[locale]/...      RSC pages ─► src/lib/queries.ts (unstable_cache) ─► Payload Local API ─► Postgres
        ├─► Server Actions     submitContactForm / submitExpertApplication ─► Payload Local API
        ├─► /api/[...slug]     Payload REST (all collections and globals, access-controlled)
        └─► /admin/[[...]]     Payload Admin UI (+ admin server functions)
```

### Project structure (key paths)
```
src/
  app/[locale]/...          public site (24 routes)
  app/(payload)/admin       Payload admin
  app/(payload)/api/[...slug]  Payload REST
  collections/              16 collections
  globals/                  SiteSettings, Navigation
  blocks/                   10 page-builder blocks (Pages collection)
  hooks/                    notifyBoardOnReview, revalidateOnPublish
  lib/                      access, queries, server actions, rateLimit, slug, seo, jsonld, quiz
  components/               home/, blocks/, layout/, ui/, admin/DashboardGuide
  messages/                 de/ar/en UI strings
migrations/                 9 migrations (.js + .json snapshots), 3 of them untracked
seed/                       seed logic (run through SEED_ON_BOOT)
scripts/                    run-seed.mjs, backup-db.mjs, baseline-migrations.mjs
backups/                    JSON dumps of production-like data (gitignored)
```

### Deployment / infrastructure
- **There is no Dockerfile, docker-compose file, `vercel.json` or CI pipeline (`.github/`).** README §Deployment says the target is "Not yet finalised" (an EU VPS with Docker, or Vercel + Neon).
- The code assumes Vercel in some places (Blob storage, the `_vercel` matcher exclusion) and a single instance in others (the in-memory rate limiter).
- A stray file named `tatus` is tracked in git. It contains `git log` output with ANSI codes and was probably created by a mistyped `git status > …`.

---

## 2. Environment and configuration

| Variable | Used by | Risk if missing or wrong |
|---|---|---|
| `DATABASE_URI` | payload.config | Falls back to `''`. Every query then fails and **is swallowed into empty or 404 pages** (§9) |
| `PAYLOAD_SECRET` | payload.config | **Falls back to `'INSECURE_DEV_SECRET_REPLACE_ME'`** with no production guard, so anyone who knows the fallback can forge JWTs |
| `NEXT_PUBLIC_SERVER_URL` | serverURL, metadataBase, email links, admin preview | Defaults to `http://localhost:3000`, which breaks emails, OG URLs and Payload CSRF origin checks |
| `SMTP_*`, `EMAIL_FROM` | nodemailer | Defaults to `localhost:587`. Send failures are logged and swallowed |
| `BOARD_NOTIFICATION_EMAIL` | notifyBoardOnReview | Merged with `SiteSettings.boardNotificationEmails` |
| `CONTACT_FORWARD_EMAIL` | contactAction | If unset, submissions are stored but no email is sent |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob plugin | If unset on Vercel, uploads fail because the filesystem is read-only |
| `PAYLOAD_MIGRATE_STATUS / _ON_BOOT / _CREATE_NAME / _BASELINE`, `SEED_ON_BOOT` | instrumentation.node | **Run on every boot while set.** On serverless that means every cold start. `SEED_ON_BOOT` left on in production would insert sample content |

`.env.local` is gitignored, and git history shows no committed env file. `.env.example` contains a personal email address as the example `BOARD_NOTIFICATION_EMAIL`.

---

## 3. Discovered user flows

### Public visitor (anonymous)
1. **Locale entry:** `/` redirects to `/de` (next-intl). Language switcher moves between `/de`, `/ar` and `/en` and sets RTL for `ar`. An unknown locale gets `notFound()` from the layout.
2. **Homepage** (`/[locale]`): sections ordered by `SiteSettings.homeGroup.sectionOrder`, covering Hero (search form), Stats (live counts), Help cards, Roadmaps, Guide, Experts, Events, News, Jobs, CTA band and App band. Copy falls back to in-code defaults when the CMS is empty.
3. **News:** list with `?page=` and `?cat=`, then detail `/news/[slug]` (JSON-LD, fallback-locale notice).
4. **Events:** `?view=upcoming|past`, `?page=`, `?cat=`, then detail `/events/[slug]`.
5. **Services:** `/services`, then `/services/[pillar]`, then `/services/[pillar]/[service]`.
6. **Austria guide:** `/guide`, then `/guide/[topic]` (paginated), then `/guide/[topic]/[article]` (disclaimer, official source, last-reviewed date).
7. **Roadmaps:** `/roadmaps`, then `/roadmaps/[roadmap]` (steps, required documents, links).
8. **Experts:** `/experts?cat=` and `/experts/[slug]` (email and phone shown only when `showEmail`/`showPhone` is set; website link).
9. **Expert application:** `/experts/apply` form → `submitExpertApplication` server action → Expert record with `in_review` → board email.
10. **Jobs:** `/jobs` (published, unexpired postings plus curated links from SiteSettings) and `/jobs/[slug]` (JobPosting JSON-LD, `revalidate = 300`).
11. **Situation quiz:** `/quiz` (client-side `SituationQuiz`) suggests roadmaps, guide content and experts by Bundesland.
12. **Search:** `/search?q=` runs a `like` match over news, events, roadmaps, guide articles and expert names, 5 results per type, cached for 5 minutes.
13. **Contact:** `/contact?kategorie=` form → `submitContactForm` → ContactSubmissions record plus a forward email.
14. **Static and legal pages:** about, partners, impressum, datenschutz/privacy-policy, barrierefreiheit/accessibility, custom 404.
15. **Cookie consent banner** on first visit.

### Editor / board / admin (authenticated, `/admin`)
16. Login, logout, forgot password and reset password (Payload built-in), plus the first-user registration screen when the `users` table is empty.
17. Dashboard with the `DashboardGuide` onboarding panel.
18. **Content workflow:** an editor creates a draft and sets `in_review`, which emails the board. Board or admin sets `published`, which syncs `_status` and fires `revalidateTag`. Archive is also possible.
19. Expert verification: only board and admin can set `verificationStatus` and `verifiedAt`. Publishing an unverified expert only logs a server warning.
20. Contact inbox: editor and above can read submissions and change their status. Only admin can delete.
21. Media upload, with an alt text requirement and a consent flag.
22. SiteSettings (homepage copy and order, contact info, social links, SEO defaults, job links, retention months, board emails) and Navigation: board and admin only.
23. User management: admin only. Users can read and update their own record. Only admin can change roles.
24. Version history and restore (20 versions per document) for versioned collections.

### Operator flows
25. `npm run seed` starts `next dev` with `SEED_ON_BOOT=1` and waits for `[seed] complete`.
26. Migrations: set `PAYLOAD_MIGRATE_*`, boot once, then unset.
27. `node scripts/backup-db.mjs` writes a JSON dump to `backups/<ts>/`. There is no restore script.

---

## 4. API surface

### 4.1 Payload REST (`src/app/(payload)/api/[...slug]/route.ts`): GET, POST, PATCH, PUT, DELETE
For each collection `{slug}`:
- `GET /api/{slug}`: list, with client-controlled `where`, `limit`, `page`, `depth`, `sort`, `locale`, `draft`, `select`
- `POST /api/{slug}`: create
- `GET | PATCH | DELETE /api/{slug}/:id`
- `PATCH | DELETE /api/{slug}?where=…`: bulk update/delete
- `GET /api/{slug}/count`
- Versioned collections: `GET /api/{slug}/versions`, `GET /api/{slug}/versions/:id`, `POST /api/{slug}/versions/:id` (restore)

Globals: `GET /api/globals/site-settings`, `GET /api/globals/navigation`, `POST /api/globals/{slug}`.

Auth (`users`): `POST /api/users/login`, `/logout`, `/refresh-token`, `/forgot-password`, `/reset-password`, `/unlock`, `/first-register`; `GET /api/users/me`, `/api/users/init`.

Other: `GET /api/access`; media files at `/api/media/file/:filename` (and `/media/*` statically from `public/media` when local); the Vercel Blob client-upload handler is registered by the plugin when it is enabled.

GraphQL: **no `/api/graphql` route file exists**, so GraphQL appears not to be mounted [Verify that `POST /api/graphql` returns 404].

### 4.2 Access matrix (collection level)

**Current, after remediation (updated 2026-10-01).** Verified cell by cell by `qa/security/s5-s6-role-matrix.test.ts`, `s7-s8-review-workflow.test.ts` and `n3-jobs-delete.test.ts`. The original audit-time matrix follows below for reference.

| Collection | read | readVersions | create | update | delete |
|---|---|---|---|---|---|
| users (auth) | admin or self | – | admin | admin or self (role: admin only) | admin |
| media (upload) | public | – | editor+ | editor+ | editor+ *(S5)* |
| categories, service-pillars, guide-topics, partners | public | – | editor+ | editor+ | admin |
| news, events, services, guide-articles, roadmaps, experts, pages | published, or editor+ for all *(S6)* | editor+ *(S6)* | editor+ | board/admin all; editor only draft / in_review *(S7)* | admin |
| jobs | published, or editor+ for all *(S6)* | editor+ *(S6)* | editor+ | board/admin all; editor only draft / in_review *(S7)* | **admin** *(N3)* |
| board-members | public | – | editor+ | editor+ | editor+ *(S5)* |
| contact-submissions | editor+ | – | editor+ *(S2; public form via server action)* | editor+ | admin |
| **Global** site-settings | public, except `boardNotificationEmails` and the retention fields (admin/board) *(S4)* | – | – | admin/board | – |
| **Global** navigation | public | – | – | admin/board | – |

Field-level read: experts `contactEmail`/`contactPhone` (editor+, or public when `showEmail`/`showPhone`), experts consent and verification fields (editor+) *(S1)*; site-settings private fields (admin/board) *(S4)*.

**Original matrix at audit time (superseded):**

| Collection | read | create | update | delete | Versions/drafts | Revalidate hooks |
|---|---|---|---|---|---|---|
| users (auth) | admin or self | admin | admin or self (role: admin only) | admin | – | – |
| media (upload) | **public** | editor+ | editor+ | **any logged-in user (incl. viewer)** | – | – |
| categories | public | editor+ | editor+ | admin | – | – (tag `categories` is never busted) |
| news | published or logged-in | editor+ | editor+ | admin | ✓ | ✓ |
| events | published or logged-in | editor+ | editor+ | admin | ✓ | ✓ |
| services | published or logged-in | editor+ | editor+ | admin | ✓ | ✓ |
| service-pillars | public | editor+ | editor+ | admin | – | ✓ |
| guide-topics | public | editor+ | editor+ | admin | – | ✓ |
| guide-articles | published or logged-in | editor+ | editor+ | admin | ✓ | ✓ |
| roadmaps | published or logged-in | editor+ | editor+ | admin | ✓ | ✓ |
| experts | published or logged-in | editor+ (public path via server action) | editor+ | admin | ✓ | ✓ |
| jobs | published or logged-in | editor+ | editor+ | **editor+** (inconsistent: admin-only elsewhere) | ✓ | ✓ |
| board-members | public | editor+ | editor+ | **any logged-in user** | – | – |
| partners | public | editor+ | editor+ | admin | – | – (tag `partners` is never busted) |
| pages | published or logged-in | editor+ | editor+ | admin | ✓ | **✗ none** |
| contact-submissions | editor+ | **public (`() => true`)** | editor+ | admin | – | – |
| **Global** site-settings | **public** | – | admin/board | – | – | ✓ (`site-settings`) |
| **Global** navigation | public | – | admin/board | – | – | ✗ (and not read by the frontend, see §9) |

"editor+" means editor, board or admin. "logged-in" includes the **viewer** role.

Field-level access: `users.role` (update: admin only), `experts.verificationStatus` and `experts.verifiedAt` (create/update: board/admin only). **There are no field-level `read` restrictions anywhere.**

### 4.3 Server Actions (public write paths)

| Action | File | Validation | Abuse protection |
|---|---|---|---|
| `submitContactForm` | `src/lib/contactAction.ts` | required fields, `@` and `.` email check, message ≥ 10 chars, consent | **No rate limit, no honeypot, no length limits** |
| `submitExpertApplication` | `src/lib/expertApplicationAction.ts` | required name and email, consent, explicit field whitelist, `overrideAccess: true` | Honeypot (`company`), in-memory rate limit of 3 per hour per IP (IP taken from `x-forwarded-for`). No length limits; `website` scheme not checked |
| Payload admin `serverFunction` | `src/app/(payload)/layout.tsx` | Payload-internal | Payload auth |

### 4.4 Public pages (per locale; German path in parentheses)
`/` · `/about` (`/ueber-uns`) · `/news` (`/nachrichten`) · `/news/[slug]` · `/events` (`/veranstaltungen`) · `/events/[slug]` · `/services` (`/leistungen`) · `/services/[pillar]` · `/services/[pillar]/[service]` · `/guide` (`/oesterreich-guide`) · `/guide/[topic]` · `/guide/[topic]/[article]` · `/roadmaps` (`/anleitungen`) · `/roadmaps/[roadmap]` · `/experts` (`/experten`) · `/experts/[slug]` · `/experts/apply` (`/experten/eintragen`) · `/jobs` (`/stellenangebote`) · `/jobs/[slug]` · `/search` (`/suche`) · `/quiz` (`/meine-situation`) · `/contact` (`/kontakt`) · `/partners` (`/partner`) · `/impressum` · `/datenschutz` (`en: /privacy-policy`) · `/barrierefreiheit` (`en: /accessibility`).

There is **no `sitemap.ts`, `robots.ts`, `error.tsx` or `global-error.tsx`**.

---

## 5. Database entities

Postgres schema generated by Payload/Drizzle. Each collection has a main table, a `_locales` table (localized fields), `_rels` (relationships) and per-array/per-block child tables. Versioned collections also get `_{slug}_v*` tables. Nine migrations exist in `migrations/`; the last three (`add_jobs_quiz_appband`, `add_expert_bundesland`, `add_jobs_drafts`) are **untracked**.

| Entity | Key fields | Relations | Localized | Unique |
|---|---|---|---|---|
| users | email, hash/salt, name, role (admin/board/editor/viewer), login attempts/lock | `users_sessions` | – | email |
| media | filename, mime, sizes (thumbnail/card/hero), alt*, caption*, credit, consentOnFile, focal point | – | alt, caption | – |
| categories | name*, slug, type (news/event/expert …) | – | name | – |
| news | title*, slug, excerpt*, body*, coverImage, category, author, publishedAt, featured, reviewStatus, `_status` | media, categories | ✓ | slug |
| events | title*, slug, description*, dates, coverImage, category, location/address, isOnline, registrationUrl, capacity, isFree, reviewStatus | media, categories | ✓ | slug |
| services | title*, slug, pillar, summary*, body*, icon, image, targetAudience, relatedServices, reviewStatus | service-pillars, services, media | ✓ | slug |
| service_pillars | title*, slug, description*, icon, colourToken, order | – | ✓ | slug |
| guide_topics | title*, slug, description*, icon, order | – | ✓ | slug |
| guide_articles | title*, slug, topic, excerpt*, body*, coverImage, lastReviewedAt, reviewIntervalMonths, officialSourceUrl, related{Services,Roadmaps,Experts}, reviewStatus | guide-topics, services, roadmaps, experts, media | ✓ | slug |
| roadmaps | title*, slug, description*, icon, quizMatches, lastReviewedAt, reviewIntervalMonths, officialSourceUrl, steps[] (requiredDocuments[], links[]), reviewStatus | guide-articles | ✓ | slug |
| experts | name, slug, categories, bio*, bundesland, city, languages[], **contactEmail, contactPhone**, showEmail, showPhone, website, photo, consentOnFile, consentDate, verificationStatus, verifiedAt, reviewStatus | categories, media | bio | slug |
| jobs | title*, slug (indexed), organisation, employmentType, bundesland/city, description*, applyUrl, expiryDate, publishedAt, reviewStatus | – | ✓ | slug |
| board_members | name, role*, photo, bio*, email/showEmail, linkedIn/showLinkedIn, order | media | ✓ | – |
| partners | name, logo, url, type, order | media | – | – |
| pages | title*, slug, layout (10 block types), seo group, reviewStatus | media (blocks) | ✓ | – |
| contact_submissions | name, email, subject, category, message, locale, consentGiven, status, submittedAt | – | – | – |
| site_settings (global) | logo, orgName*, tagline*, contactGroup, socialLinks[], seoGroup, jobResourceLinks[], homeGroup (hero, sectionOrder[], statLabels[], helpCards[], CTA band), submissionRetentionMonths, expertApplicationRetentionMonths, **boardNotificationEmails[]** | media | partially | – |
| navigation (global) | header[] (children[]), footer[] | – | labels | – |
| payload_* (system) | payload_migrations, payload_preferences, payload_locked_documents, payload_kv | – | – | – |

`*` = localized field. Only `jobs.slug` has an explicit `index: true`. `unique` creates indexes on the other slugs. Searched fields (`title` in `_locales` tables, `experts.name`) and filtered fields (`reviewStatus`, `expiryDate`, event dates) have **no explicit indexes**.

---

## 6. Authentication

- **Mechanism:** Payload built-in `auth: true` on `users`: email and password (PBKDF2 hash with salt), JWT in an HTTP-only `payload-token` cookie, server-side sessions (`users_sessions` table exists).
- **Config:** everything is a Payload default. `tokenExpiration`, `maxLoginAttempts`, `lockTime`, cookie `secure`/`sameSite`, `verify` and `useAPIKey` are not set. [Verify the effective defaults: lockout after N attempts, cookie `Secure` in production, token lifetime.]
- **Secret:** `PAYLOAD_SECRET` with an **insecure hard-coded fallback** (§2).
- **Password reset:** Payload `forgot-password` sends email via SMTP. There is no rate limit beyond Payload defaults.
- **First user:** while `users` is empty, `/admin/create-first-user` lets **anyone** create the first admin. This is a risk on any freshly deployed database before seeding.
- **Public site:** no end-user authentication. Visitors stay anonymous.
- **CSRF / CORS:** no `cors` or `csrf` config. Payload's default CSRF whitelist is derived from `serverURL`, so a wrong `NEXT_PUBLIC_SERVER_URL` weakens it.

## 7. Authorization rules

Defined in `src/lib/access.ts`:
- `isAdmin`, `isAdminOrBoard`, `isEditorOrAbove` (admin, board, editor), `isLoggedIn` (**includes viewer**), `isAdminOrSelf`, `readPublishedOrLoggedIn` (anonymous users get the filter `reviewStatus = published`; any logged-in user sees everything).
- **Publishing workflow** is enforced by hooks, not by access control:
  - `enforceReviewStatusAccess`: if the role is `editor` and the requested `reviewStatus` is `published` or `archived`, the hook resets it to `originalDoc.reviewStatus ?? 'draft'`.
  - `syncPublishStatus`: forces `_status = (reviewStatus === 'published') ? 'published' : 'draft'`.
  - `notifyBoardOnReview`: emails the board on the transition into `in_review`.
- **Role semantics:** viewer is "read-only" by intent, but it can delete Media and BoardMembers (§4.2) and read every draft.

---

## 8. Admin functionality

Payload Admin at `/admin`, with UI language de/ar/en and the custom `DashboardGuide` component. Available features: CRUD for all 16 collections, editing both globals, drafts and version history (`maxPerDoc: 20`), the 10 page-builder blocks, media library with focal point and sizes, document locking, live preview URL (Jobs only), user and role management (admin), and the contact submission inbox.

Admin-side issues spotted:
- `DashboardGuide/copy.ts` still says "Jobs are not a collection of their own", which is stale now that the `jobs` collection exists.
- The **Navigation global is editable but nothing on the frontend reads it**: Header and Footer are hard-coded. Board edits there have no effect.
- `submissionRetentionMonths` and `expertApplicationRetentionMonths` are editable, but **no code enforces them** (no purge job). The settings suggest a GDPR retention policy that does not exist.

---

## 9. Logging and error handling

- Logging uses `console.*` in server actions and instrumentation and `req.payload.logger` in hooks. There is no error tracking (Sentry etc.), no structured request logging, and no health endpoint.
- **Every query in `src/lib/queries.ts` wraps its body in `try { … } catch { return null | [] }`, and the wrapper is `unstable_cache`.** A transient DB error (Neon cold start, pool exhaustion, timeout) therefore produces an empty list or `null` → `notFound()`, and **that empty result is cached for the full TTL (60–3600 s)**. Detail pages can be cached as 404s.
- Email failures are logged and never block saves (intended).
- There is no `error.tsx` or `global-error.tsx`, so unhandled render errors show the default Next.js error page.
- `instrumentation.node.ts` rethrows migration errors, which crashes boot (intended).

---

## 10. Existing tests

**There are none.** No unit, integration, e2e or visual tests; no test runner (Jest, Vitest, Playwright) in `package.json`; no CI.

What exists today:
- `npm run typecheck` (`tsc --noEmit`) **passes** (exit 0, run during this audit).
- `npm run lint` (ESLint 9, next core-web-vitals + typescript) **passes** (exit 0, run during this audit).
- Manual verification passes documented in `DECISIONS.md` (e.g. the "/de, /ar, /en verification pass").
- `src/instrumentation.node.ts` prints a dev-only schema warning when the `homeGroup` columns are missing.

---

## 11. Potential security risks

| # | Severity | Finding | Location | Status |
|---|---|---|---|---|
| S1 | **High** | **Expert contact data leaks through the REST API.** `GET /api/experts` (anonymous) returns `contactEmail`, `contactPhone`, `consentDate` and `verificationStatus` for every published expert, **whatever `showEmail`/`showPhone` say**. The toggles only affect the React page. Anonymous `where[contactEmail][like]=` queries also work. This is a GDPR problem. | `collections/Experts.ts` (no field `read` access) | Confirmed |
| S2 | **High** | **Public create on `contact-submissions` via REST** (`create: () => true`). `POST /api/contact-submissions` skips the server action entirely: no consent check, no length limit, no rate limit, and the caller can set `status: 'archived'` (hiding the message from the inbox) and `submittedAt`. Unlimited DB spam. | `collections/ContactSubmissions.ts` | Confirmed |
| S3 | **High** | **Insecure `PAYLOAD_SECRET` fallback.** If the env var is missing in production, JWTs are signed with a constant that is public in this repo, so admin sessions can be forged. | `payload.config.ts:40` | Confirmed |
| S4 | **High** | **Board notification email addresses are public.** `GET /api/globals/site-settings` returns `boardNotificationEmails[]`, which is fetched anonymously. | `globals/SiteSettings.ts` | Confirmed (no field read access) [Verify response] |
| S5 | Medium | **The viewer role can delete Media and BoardMembers** (`delete: isLoggedIn`). Deleting media breaks images site-wide. | `Media.ts`, `BoardMembers.ts` | Confirmed |
| S6 | Medium | **Viewer and every other logged-in role read all drafts, in-review and archived content** of every collection (`readPublishedOrLoggedIn` returns `true` for any user). | `lib/access.ts` | Confirmed |
| S7 | Medium | **Editors may be able to bypass review on already-published docs.** When an editor edits a published doc, `enforceReviewStatusAccess` keeps `reviewStatus = 'published'`, so `syncPublishStatus` publishes the editor's changes immediately. The same applies to "Save draft". | `lib/access.ts` | [Verify] |
| S8 | Medium | **A partial REST `PATCH` without `reviewStatus` may unpublish a document.** `syncPublishStatus` reads only the incoming `data`, so `undefined !== 'published'` gives `_status: 'draft'`. | `lib/access.ts` | [Verify] |
| S9 | Medium | **HTML injection in outgoing emails.** `name`, `email`, `subject`, `category` and `message` are interpolated unescaped into the contact forward HTML. The document `title` and the user name are interpolated unescaped into the board notification. Attacker-controlled HTML (links, fake content) gets delivered to `info@` from the site's own sender. | `contactAction.ts`, `notifyBoardOnReview.ts` | Confirmed |
| S10 | Medium | **Contact form server action has no rate limit, no honeypot and no captcha.** Each call writes to the DB and sends an SMTP email (mail bombing, SMTP quota exhaustion). | `contactAction.ts` | Confirmed |
| S11 | Medium | **The expert-application rate limit is weak.** It is in-memory (per instance, reset on restart, effectively nothing on serverless) and keyed on the first `x-forwarded-for` value, which a client can spoof unless the proxy overwrites it. Each application emails the board. | `rateLimit.ts`, `expertApplicationAction.ts` | Confirmed |
| S12 | Medium | **No app-level input length limits** on any public free-text field (name, bio, message, languages list, website): no `maxLength` in the server actions or the collection fields. *Corrected 2026-10-01: Payload's default `defaultMaxTextLength` still caps each text/textarea field at 40,000 chars (see §16).* | actions, collections | Confirmed |
| S13 | Medium | **Missing security headers:** no CSP, HSTS, `X-Frame-Options`/`frame-ancestors` (clickjacking on `/admin`) or Permissions-Policy. Only `nosniff` and `Referrer-Policy` are set. | `next.config.ts` | Confirmed |
| S14 | Medium | **First-user registration is open** on an empty DB (§6). | Payload default | Confirmed (behaviour) |
| S15 | Medium | **Unbounded REST queries.** Anonymous callers control `limit`, `depth`, `where` (including `like` and nested relationship queries) and `pagination=false` on public collections, which is a cheap DoS / DB-load vector. | Payload REST | [Verify the limits Payload enforces] |
| S16 | Low–Med | **Expert `website` from the public form** is not checked for an `http(s)` scheme and is rendered as `<a href>`. React 19 blocks `javascript:` URLs, but `data:` and other schemes and phishing links depend on the board noticing during review. | `experts/[slug]/page.tsx:135` | Confirmed |
| S17 | Low–Med | **JSON-LD via `dangerouslySetInnerHTML={{__html: JSON.stringify(...)}}`** does not escape `</script>`. Content is editor-controlled, so a malicious or compromised editor account gets stored XSS against visitors and admins. | news, events, guide, roadmaps, jobs detail pages | Confirmed |
| S18 | Low | **`GET /api/media` is public** and lists every uploaded file, including files only used in drafts and PDFs, plus `consentOnFile` flags. | `Media.ts` | Confirmed |
| S19 | Low | **The GDPR retention settings are not enforced** (contact submissions and unpublished expert applications are kept forever). | SiteSettings | Confirmed |
| S20 | Low | **Unverified experts can be published** (warning only, by design). The `getExperts` comment says "Published + verified experts only", but the query does not filter on `verificationStatus`. | `queries.ts:652` | Confirmed |
| S21 | Info | `backups/` holds real DB dumps, including `users` (password hashes) and `users_sessions`. It is gitignored; keep it off shared drives. | `backups/` | Confirmed |
| S22 | Info | The `.env.example` default `BOARD_NOTIFICATION_EMAIL` is a personal address, and the tracked `tatus` file leaks commit history. | repo root | Confirmed |

---

## 12. Potential performance bottlenecks

| # | Area | Finding |
|---|---|---|
| P1 | **DB connections** | `pool.max: 20` per process. On Vercel + Neon, every lambda instance opens its own pool, so connection exhaustion is likely under load unless the Neon pooled (`-pooler`) endpoint is used. |
| P2 | **Search** | `/search?q=` runs 5 `ILIKE '%q%'` queries over `_locales` title columns with no trigram index, so each is a sequential scan. Each distinct query creates a new `unstable_cache` entry (100-char cap, but unbounded key count), and there is no rate limit. |
| P3 | **Error caching** | DB errors are cached as empty results or 404s for up to 1 h (§9). This affects availability, not just speed. |
| P4 | **Cache invalidation gaps** | (a) `getNewsBySlug` is tagged `tags.newsItem('', '')` = `news---`, so the per-slug busting in the hook never matches. (b) The hook only busts on **publish-status transitions**, so editing an already-published doc is not revalidated and stays stale for up to the TTL (**3600 s** for experts, roadmaps, guide topics and pillars). (c) `pages`, `categories`, `partners` and `navigation` have no busting hooks at all. |
| P5 | Over-fetching | `depth: 3` on detail queries; `isLocaleFallback` adds a second `findByID` per `ar`/`en` detail request; `getExperts` fetches up to 100 at `depth: 1` with no pagination; `getPartners` uses `depth: 2`. |
| P6 | Missing indexes | `reviewStatus`, `expiryDate`, event date fields, `categories.type`, and the `_rels` lookups used in filters. |
| P7 | Public REST | Unbounded `limit`/`depth` (S15). |
| P8 | Build | `generateStaticParams` on every detail route queries the DB at build time, so the build fails or produces empty output if the DB is unreachable. |
| P9 | Boot | `instrumentation.node.ts` initialises Payload and queries `information_schema` on **every dev boot**, and runs migrations/seed on every cold start while the flags are set. |
| P10 | Homepage | About 10 sections, each with its own cached query, plus count queries. Fine while warm, but a cold cache produces a burst of DB round trips. |

---

## 13. Missing tests (gap list)

Every item below is untested today.

**Security / access control**
- Anonymous REST access per collection and global: read/create/update/delete, including the `where`, `draft=true`, `/versions` and `select` variants.
- Field exposure: experts `contactEmail`/`contactPhone`, site-settings `boardNotificationEmails`, `users` (no hashes or salts in output).
- Role matrix (admin, board, editor, viewer) × 16 collections × CRUD.
- Workflow: an editor cannot publish or archive; the editor-edits-published-doc path (S7); partial PATCH (S8); `_status` sync; verificationStatus field access.
- Auth: login lockout, logout, token expiry, forgot/reset password, first-register closed once users exist, the secret fallback guard.

**Server actions**
- Contact: validation branches, consent, DB write, email forward (success and failure), HTML escaping, abuse (volume).
- Expert apply: honeypot, rate limit (including the XFF spoof), field whitelist (extra fields ignored: `reviewStatus`, `verificationStatus`, `photo`), slug uniqueness and collisions (`uniqueSlug`), invalid category ID, board email triggered.

**Business logic (unit)**
- `slugify` (diacritics, Arabic-only names → `eintrag`, the 80-char cap), `uniqueSlug`.
- `checkRateLimit` window behaviour.
- `resolveInternalHref` (canonical keys per locale, external URLs, `mailto:`/`tel:`, query strings, unknown paths).
- `lib/quiz.ts` matching, `lib/homeSections.ts` ordering and enabled flags, `lib/jsonld.ts` and `lib/seo.ts` output, `contactCategories`.
- `revalidateOnPublish` transition logic and the tags it busts.
- `notifyBoardOnReview` (recipient merge and dedupe, transition detection, never throws).

**Data / queries (integration against a test Postgres)**
- Only published content is returned, jobs expiry filtering, upcoming vs. past events, pagination edges (`page=0`, `-1`, `abc`, beyond the last page), category filters, locale fallback detection.
- Migrations apply cleanly on a fresh DB, in order, and down-migrations work; the three untracked migrations are included.
- Seed is idempotent.

**Frontend / e2e**
- All 24 routes × 3 locales render with status 200; localized German slugs; locale switcher keeps the current page; RTL layout for `ar`; 404 for unknown slugs and locales.
- Forms end to end (contact, expert apply), with success and error messages in all locales.
- Search, quiz flow, cookie consent (no optional scripts before consent).
- Accessibility (axe): skip link, form labels, contrast, `lang`/`dir`.
- SEO: metadata, hreflang alternates, JSON-LD validity, `noindex` on search.

**Non-functional**
- Load test: homepage, list and detail pages, search, the contact action; DB connection counts.
- Cache correctness: publish/unpublish/edit/delete → visible on the site within the expected time.
- Resilience: DB down → no long-lived cached 404s.
- Security headers and a dependency audit (`npm audit`).

---

## 14. Critical areas that require testing (ranked)

1. **Public data exposure via the Payload REST API** (S1, S4, S6, S18): this is personal data, so it is a legal and GDPR exposure.
2. **Public write endpoints** (S2, S9–S12): the contact REST create, both server actions, and email side effects.
3. **Authentication hardening** (S3, S14, lockout, cookie flags).
4. **Role/permission matrix and the publishing workflow** (S5, S7, S8): the hooks are the only enforcement.
5. **Caching and invalidation correctness**, plus error caching (P3, P4): stale or 404 public content.
6. **Migrations on a fresh DB** and the boot-flag operations, including the untracked migrations.
7. **i18n / RTL routing** across 24 routes × 3 locales.
8. **Performance under load**: DB pool, search, unbounded REST queries.

---

## 15. Recommended testing plan (priority order)

**Phase 0: Tooling (prerequisite, ~1 day)**
- Add **Vitest** (unit and integration) and **Playwright** (e2e, with axe).
- Use a disposable Postgres (Docker `postgres:16` or a Neon branch) and a `.env.test`. Boot Payload with `getPayload` in Vitest. Note the documented tsx/ESM interop issue (DECISIONS.md "Known issues"): integration tests may need to run against a live `next dev`/`next start` over HTTP instead of importing the config.
- Add a CI workflow: `typecheck`, `lint`, unit, integration, e2e.

**Phase 1 (P0): Security and access control (integration, HTTP against a running app)**
1. An anonymous REST matrix for every collection and global, asserting the exact status codes and **response field sets** (catches S1, S2, S4, S18).
2. A role matrix (admin, board, editor, viewer) × CRUD using seeded test users (S5, S6).
3. Workflow tests: an editor publishing, archiving, editing a published doc, saving a draft on a published doc, and a partial PATCH (S7, S8); verificationStatus field access.
4. Auth: lockout after N failures, `Secure`/`HttpOnly`/`SameSite` cookie flags in a production build, first-register blocked once users exist, and a startup assertion that `PAYLOAD_SECRET` is set (S3, S14).
5. Header check (S13), plus `npm audit`.

**Phase 2 (P0): Public write flows**
6. Contact action: every validation branch, DB record contents, email payload (mock transport) **with HTML-escaping assertions**, and email-failure tolerance.
7. Expert application: honeypot, whitelist (posting `reviewStatus=published`, `verificationStatus=verified` and `photo` must be ignored), slug collisions, rate limiting including the spoofed XFF, board notification sent.
8. Abuse and length tests (very large inputs, Unicode/RTL, emoji, HTML/script payloads).

**Phase 3 (P1): Unit tests for pure logic**
9. `slug`, `rateLimit`, `internalHref`, `quiz`, `homeSections`, `jsonld`, `seo`, `revalidateOnPublish` (transition and tag matrix), `notifyBoardOnReview`, `access.ts` functions.

**Phase 4 (P1): Data, cache and migrations**
10. Query helpers against seeded data: published-only filtering, job expiry, events upcoming/past, pagination edges, category filters, locale fallback flag.
11. Cache correctness e2e: publish → visible; edit a published doc → updated; unpublish or delete → gone (records the actual staleness windows; catches P4).
12. Resilience: stop the DB, request pages, restart the DB, and assert recovery without cached 404s (P3).
13. Fresh-DB migration run (all 9, in order) plus seed idempotency; schema snapshot diff against `payload.config`.

**Phase 5 (P1): E2E functional across locales (Playwright)**
14. A smoke crawl of 24 routes × 3 locales: status 200, `lang`/`dir`, no console errors, no broken internal links, correct German slugs.
15. User journeys: homepage → search → result; quiz → recommended roadmap/expert; contact form; expert application; news/events pagination and filters; language switching on detail pages; 404s.
16. Admin journeys: login, create a draft, submit for review (email captured), publish as board, check the public site, revert a version, upload media.
17. Accessibility (axe on every template, keyboard-only form submission) and an RTL visual check for `ar`.

**Phase 6 (P2): Performance**
18. k6/Artillery against a production build: homepage, list and detail pages, `/search` with random terms, the contact action. Monitor Postgres connections and the p95 latency.
19. `EXPLAIN ANALYZE` on search and list queries; Lighthouse CI on key templates (LCP, CLS, JS weight).

**Phase 7 (P2): Ops and regression**
20. Boot-flag operations (`PAYLOAD_MIGRATE_*`, `SEED_ON_BOOT`) in a staging environment; backup → restore drill (no restore script exists yet).
21. Visual regression snapshots of the homepage and key templates against the Figma exports in `design/`.

---

## 16. Verification log

**2026-10-01, Phase 0 + P0 verification.** Details and evidence are in `QA_FINDINGS_P0.md`; the automated tests are in `qa/`.

| Finding | Result |
|---|---|
| S1 | Reproduced (High). The `where`/`count`/`select` oracle on hidden fields is also confirmed. |
| S2 | Reproduced (High). Omitting consent is **also** accepted (stored as `false`). |
| S3 | Reproduced (High, conditional). Forged tokens need a valid session `sid` (Payload `useSessions`), but an expired, unpruned session is enough. Not yet run under `next start`. |
| S4 | Reproduced. **Severity revised High → Medium.** |
| S5 | Reproduced (Medium). |
| S6 | Reproduced (Medium). The intended scope of the viewer role needs a product decision. |
| S14 | Reproduced incidentally (anonymous first-register creates an admin on an empty DB). |

**Corrections to this document:**
- **S12 ("no input length limits") is partly wrong.** Payload's default `defaultMaxTextLength` caps every text/textarea field at 40,000 characters; the app sets no limits of its own.
- **§5 migration status.** All 9 migrations (including the 3 untracked ones) apply cleanly to an empty database.

**2026-10-01, remediation.** S1–S6 are fixed and covered by regression tests (321 passing). Details, behaviour changes and the remaining open findings are in `SECURITY_REMEDIATION.md`.

**2026-10-01, S7/S8.** S7 reproduced and fixed with an access-level update rule. S8 did not reproduce: Payload 3.88 passes the merged document to collection `beforeChange` hooks, so the §11 S8 hypothesis was wrong. It is regression-guarded anyway. Details are in `SECURITY_REMEDIATION.md`.

**2026-10-01, N3.** Jobs delete was editor+ (editor and board could delete published jobs); it is now admin only, like the other reviewed collections. §4.2 now shows the current access matrix, with the original kept below it. Details are in `SECURITY_REMEDIATION.md`.
