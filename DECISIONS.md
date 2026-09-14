# DECISIONS.md

Non-obvious technical decisions, one or two lines each, with the reason.
Future developers and the SVÖ board can use this to understand why things are the way they are.

## Stack

**Next.js 16 App Router + Payload CMS 3.88 inside the same process.**
One deployable, no per-seat licensing, REST + GraphQL API available from day one for a future mobile app.

**PostgreSQL via @payloadcms/db-postgres (Drizzle ORM).**
Payload 3.x dropped MongoDB as default; Postgres is more suitable for structured relational content with multi-locale fields.

**next-intl 4.x for URL routing + UI strings; Payload localisation for content fields.**
They are complementary, not competing. next-intl owns the URL prefix (`/de|ar|en`) and component strings. Payload owns content field translations. Running both is the correct pattern — the brief's "pick one" warning was about not running two URL routing systems.

**Tailwind CSS v4 (CSS-first config, no tailwind.config.js).**
v4 ships logical properties (`ps-`, `pe-`, `ms-`, `me-`) in core, which is essential for RTL support without a second stylesheet.

## Architecture

**`(payload)` route group isolated from `[locale]` route group.**
Prevents Tailwind CSS and next-intl middleware from affecting the Payload admin panel. Each group has its own layout chain.

**CSS (globals.css) imported only in `[locale]/layout.tsx`, not root layout.**
Root layout is minimal to avoid Tailwind's `@layer base` styles affecting Payload's admin styles.

**`lang` and `dir` set via inline script in `[locale]/layout.tsx`, not in root layout.**
The root `<html>` element is in the root layout (required by Next.js), but only the frontend routes know the locale. The script runs synchronously before React hydration to prevent flash of wrong text direction.

## Content model

**Austria's 9 federal states (`Bundesländer`) are a `select` field on `Events`/`News`, not a relationship to a collection or global.**
The original design had `Events.bundesland` / `News.bundesland` as `relationship` fields targeting a `Bundeslaender` *global* — Payload only allows relationships to target collections, so this crashed the entire app at boot (`InvalidFieldRelationship`). Since the 9 states are a fixed, never-changing enumeration, a shared `select` field (`src/fields/bundeslandField.ts`) with localized option labels is simpler and correct — no join, no extra collection to seed or manage permissions for.

**Single `Categories` collection with a `type` field (`news | event | service`).**
Keeps the schema generic. Phase 2 features (roadmaps, jobs, ticketing) can add new type values without a schema migration.

**`reviewStatus` custom field overlaying Payload's built-in `_status`.**
Payload natively supports only `draft | published`. We need `draft → in_review → published → archived`. A `beforeChange` hook syncs `_status` with `reviewStatus` so Payload's native filtering still works for the public API.

**Editor role enforced in `beforeChange` hook, not field-level access.**
Payload field-level access is binary (true/false) and cannot restrict specific option values. The hook `enforceReviewStatusAccess` prevents editors from escalating to `published` or `archived`.

**Board email recipients in two places: `BOARD_NOTIFICATION_EMAIL` env var AND `SiteSettings.boardNotificationEmails`.**
Env var is the bootstrap fallback (works before the admin is set up). CMS setting is the persistent, user-manageable version. The hook uses both, deduplicated.

## i18n

**Arabic locale uses English-language path segments under `/ar/`.**
Decision made by client. The `/ar/` prefix provides locale context; English segments are easier to maintain in CMS slugs and avoid Arabic-script URL encoding issues in email clients and analytics tools.

**German-specific URL segments for DE locale only** (nachrichten, veranstaltungen, leistungen, kontakt, partner).
Respects the German-first design principle. Arabic and English use English path words. Configured in `next-intl` `pathnames`.

**Untranslatable Austrian terms stay German in all locales.**
*AMS, ÖGK, Meldezettel, Ausbildung, Lehre, Impressum, Datenschutzerklärung* are not translated. This matches how the Syrian community in Austria actually communicates these terms, as confirmed by client.

**`fallback: true` in Payload localization config.**
Missing Arabic or English translations silently fall back to German content. The frontend adds a "not yet available in this language" notice. Never shows an empty page.

**"Next"/"read more" arrows use `forwardArrow(locale)` / `backArrow(locale)` from `src/i18n/routing.ts`, never a hardcoded `→`.**
A hardcoded arrow character doesn't flip with `dir="rtl"` — it's plain text, not a mirrored icon. `Pagination.tsx` had shipped with `next: 'Nächste →'` and `next: 'التالي →'` using the *same* arrow for German and Arabic, when "forward" in an RTL reading direction points left. Applies wherever a directional glyph sits next to link text (card "read more" links, section "view all" links); doesn't apply to icons that don't imply direction (calendar, pin) or ones already handled via CSS mirroring.

## Media

**Local disk storage (`public/media/`) for Phase 1.**
Simplest option, zero cost, works on any VPS. Phase 2: switch to S3-compatible storage by adding the `@payloadcms/storage-s3` adapter and pointing `MEDIA_S3_*` env vars — no other code change needed.

**Image sizes: thumbnail (400×300), card (768×512), hero (1920×1080).**
Covers the main use cases: news cards, hero sections, thumbnails in admin. next/image handles responsive srcsets from these variants.

**`sharp` passed explicitly into `buildConfig({ sharp, ... })`.**
It's not enough for `sharp` to be an npm dependency — Payload needs the module reference itself to generate the `imageSizes` variants above. Without this line, every image upload silently skipped resizing (`Image resizing is enabled... but sharp not installed`, even though it was) and `MediaImage`'s `size="thumbnail"|"card"|"hero"` would have had nothing to pick from.

## Performance / scalability

**`cache()` wrapper on `getPayloadClient()` in `src/lib/payload.ts`.**
Ensures one Payload instance per request in React Server Components — safe for concurrent traffic.

**ISR with `revalidate` tags** will be added to each page as slices are built.
Tagged revalidation means a news publish only invalidates news pages, not the entire cache.

**`makeRevalidateOnPublish` only busts the cache on an actual publish-state transition — except for collections with no `reviewStatus` field at all.**
The hook compares `previousDoc.reviewStatus === 'published'` against `doc.reviewStatus === 'published'` and skips revalidation when neither changed. For `ServicePillars` (no draft/review workflow — `access.read: () => true`, everything's public immediately), both sides are always `undefined`, so `undefined === undefined` was always true and the cache was **never** busted on create or update, confirmed by creating a pillar through the admin UI and watching `/leistungen` stay empty. Fixed by checking `'reviewStatus' in doc` first — collections without the field always revalidate; collections with it keep the original transition-only behavior.

**Stateless app design** (no server-side session state, media on disk or S3).
Adding more containers for horizontal scaling requires no code change.

## DSGVO

**`vanilla-cookieconsent` (MIT, no external calls).**
Blocks non-essential scripts before consent. Reject button has equal visual weight to Accept — required by DSGVO. No pre-ticked boxes.

**Fonts self-hosted; no Google Fonts CDN.**
Loading from Google's CDN sets a cookie and logs IPs — explicitly ruled illegal for Austrian/German sites by multiple court decisions. Fonts are in `public/fonts/` and loaded via `next/font/local`.
Files were extracted from the `@fontsource/inter` and `@fontsource/cairo` npm packages (OFL-licensed, same upstream files Google Fonts serves, repackaged for self-hosting) — `latin` subset for Inter (covers German umlauts/ß via Latin-1 Supplement), `arabic` subset for Cairo. The packages themselves are not a runtime dependency; only the four woff2 weights per family (400/500/600/700) were copied into `public/fonts/`.

**Contact form submissions stored in `ContactSubmissions` collection + forwarded by email.**
12-month auto-deletion default, configurable in `SiteSettings.submissionRetentionMonths`. Consent checkbox is required.

**`consentOnFile` boolean on `Media`.**
Tracks that written consent for photos of identifiable people has been documented. Not a substitute for actually having the consent — just a tracker for the SVÖ team.

## Legal

**Impressum and Datenschutzerklärung ship as placeholder pages with visible build-time warning.**
Legal text is never generated or invented. Content must come from the SVÖ board or their lawyer.

## Roadmaps slice (BRIEF-AMENDMENT-01 Slice 2)

**Route segments: `/anleitungen` (de) / `/roadmaps` (ar, en) for the collection itself — not `/wegweiser`.**
The amendment's §2.9 suggests "Wegweiser" as the name for the *combined Guide+Roadmaps nav entry*,
not as the Roadmaps collection's own URL. Using it for both would mean a nav button labelled
"Wegweiser" opens a menu containing an item also labelled "Wegweiser" pointing at `/wegweiser` —
confusing. "Wegweiser" is reserved for the nav dropdown button (`nav.guideMenu`); the route itself
is `/anleitungen` ("guides/instructions"), distinct from Guide's `/oesterreich-guide`.

**Nav grouping implemented as a real dropdown (`GuideMenu` in `Header.tsx`), not a static combined link.**
Keeps `Header`'s top-level item count at 5 (was 5 before Guide/Roadmaps existed as separate items),
satisfying §2.9's overflow concern. Keyboard/pointer accessible: `aria-haspopup`/`aria-expanded` on
the trigger button, `role="menu"`/`role="menuitem"` on the panel, closes on outside pointerdown and
on Escape. Mobile menu skips the dropdown entirely and just lists both links flatly under the
"Leistungen" item — no overflow problem exists at mobile width, so no need for the extra interaction cost.

**Roadmaps is a flat collection, no parent "roadmap topics."** Unlike Guide's topic→article nesting,
the amendment's schema (§3) describes each roadmap as one complete procedure with an ordered
`steps` array — there's no intermediate grouping level to model.

**`responsibleAuthority` and `timing` on each step are localized text, not a fixed enum.** Authority
names (AMS, ÖGK, MA 35...) are mostly stable across locales, but the field also needs to carry
free text ("or the district office responsible for your address"), which an enum can't express.

**Added `HowTo` JSON-LD to Roadmap detail pages** (`roadmapSchema` in `lib/jsonld.ts`) — steps map
directly onto `HowToStep`, and this is genuinely how these pages should appear in search (step-by-step
official procedures), consistent with the existing one-schema-per-content-type convention.

**Bug found and fixed while building this slice: `makeRevalidateOnPublish` never had a case for
`guide-topics` or `guide-articles`.** The Guide slice's collections were passing their own collection
name into the hook, but the `bust()` switch statement inside `revalidateOnPublish.ts` only had cases
for `news`/`events`/`services`/`service-pillars`/`pages` — publishing a GuideArticle never actually
called `revalidateTag(tags.guide())`. It happened to look like it worked during Guide slice testing
because Next dev's per-request caching is weak enough that the change showed up anyway; it would not
have reliably worked in production. Fixed by adding `guide-topics`/`guide-articles` cases (both bust
`tags.guide()`) and a new `roadmaps` case, and by adding the `afterChange` hook to `GuideTopics`
entirely — it had none before, so editing a topic's title/order never busted anything.

## Experts slice (BRIEF-AMENDMENT-01 Slice 3 — security-sensitive)

**Public write path (§2.1):** `Experts.access.create` stays `isEditorOrAbove` — it is never opened to
the public. The only way an anonymous applicant's data reaches the database is
`src/lib/expertApplicationAction.ts`, a Next.js Server Action that calls `payload.create` with
`overrideAccess: true` and an explicit field whitelist (name, bio, city, languages, contactEmail,
contactPhone, website, categories, consent — nothing else). `formData` is never spread into the
`data` object. `photo` is deliberately not in the whitelist or the public form at all — the board
adds it after verification, admin-only. A honeypot field (`company`, visually hidden via CSS
positioning, not `type="hidden"`, and excluded from the tab order) silently no-ops the submit if
filled. Per-IP throttling (3/hour) is a bare in-memory limiter (`src/lib/rateLimit.ts`) — good
enough for this site's traffic and single-instance deployment; revisit if that ever changes.

**Applications reach a human (§2.2):** the server action hardcodes `reviewStatus: 'in_review'` —
never user-controlled, never `'draft'` — so `notifyBoardOnReview` fires on every application.
Verified empirically: submitting through the live form produced a record with `reviewStatus:
"in_review"` and triggered the board notification email (which failed only because this dev
environment's SMTP credentials aren't real — see `notifyBoardOnReview`'s own try/catch, unrelated
to this slice).

**Slugs, but intentionally NOT localized (§2.3):** `name` and `slug` are plain (non-`localized`)
text fields — a person's name and their listing URL don't change per language, only `bio` does.
This was a deliberate deviation from Guide/Roadmaps/Services (where slug *is* localized) because it
completely sidesteps the untranslated-locale-slug-404 bug documented above: `getExpertBySlug`
doesn't need a locale-scoped WHERE match to find the right document, so `/ar/experts/<slug>` and
`/en/experts/<slug>` resolve correctly today with zero extra work, verified in the browser. Slugs
are generated server-side from the applicant's name via `src/lib/slug.ts` (`uniqueSlug`, ASCII
slugify + `-2`/`-3` collision suffix) since applicants never type a URL segment themselves.

**Field-level access on `verificationStatus`/`verifiedAt` (§2.1):** collection-level `create`/`update`
access can't gate an individual field's value on insert (an editor with create access can still set
any field's initial value). Added a `FieldAccess`-typed `boardOrAdminOnly` and applied it as
`access: { create, update }` directly on both fields, so only `admin`/`board` roles can ever set
them — a plain `editor` cannot self-verify a listing, on create or update.

**No Person JSON-LD (§2.7):** the Experts detail page emits no `<script type="application/ld+json">`
at all (verified in-browser: zero such tags on `/de/experten/[slug]`) — simplest way to guarantee no
third-party contact details are ever pushed into structured data / rich search results.

**Verification ownership — open question, not resolved by this slice.** §2.7 asks to record who
owns confirming an applicant is actually registered with the relevant chamber (Rechtsanwaltskammer,
Ärztekammer, etc.). That's a board staffing decision, not a code decision — flagged in
`CONTENT-NEEDED.md` rather than invented here. Until it's answered, treat every `unverified` listing
as unconfirmed even if published; the code does not block publishing on `verificationStatus` (same
as every other collection, publishing is an editorial judgment call, not a system-enforced gate) —
the board should verify *before* publishing, by process, not by a hard technical constraint.

**Removal path (§2.7):** operationally, an expert asks to be delisted via the existing contact form
(or direct email); the board then sets `reviewStatus` to `archived` (keeps the record for audit) or
deletes it outright via the admin panel. No new code needed — this reuses the existing moderation
UI. The Datenschutzerklärung's real legal text (still a placeholder — see `CONTENT-NEEDED.md`) needs
to describe this path explicitly once written.

**Retention (§2.7):** added `SiteSettings.expertApplicationRetentionMonths` (default 12), following
the exact precedent of `submissionRetentionMonths` for `ContactSubmissions` — which is itself a
documented-but-**not-yet-enforced** setting (no scheduled-task runner exists in this repo; the tsx
CLI is broken — see "Known issues" below). Same gap, tracked together: whoever eventually builds the
retention job for `ContactSubmissions` should build it for expired/unpublished `Experts` records in
the same pass.

**Nav dropdown renamed "Wegweiser" → "Ressourcen"** (`Header.tsx`'s `GuideMenu`) now that it holds
three items (Guide, Roadmaps, Experts) instead of two — "Wegweiser" (signpost) fit a
navigate-a-procedure pairing but strains to cover a directory of people. "Ressourcen"/"Resources"/
"موارد" reads naturally for all three and needed no further redesign of the dropdown itself.

**Dev-server note for future slices:** mid-slice, the long-running `next dev` process became
unresponsive to *all* requests (not just new ones) after many back-to-back collection-schema edits —
each edit makes Payload's dev-mode "pull schema from database" step re-run, and these apparently
piled up until something (most likely DB connection/pool contention, not a CPU-bound loop — the
process was idle, not spinning) wedged the whole process. Fix was simply restarting `next dev`.
If a session doing heavy schema iteration sees requests mysteriously hang site-wide (not just on the
route you just edited), suspect this before assuming a code bug — restart the dev server first.

## Known issues

**Every standalone Payload CLI-adjacent command — `npm run seed`, `generate:types`, `generate:importmap`, `db:migrate` — currently crashes.** None of these are bugs in this project's schema/config; all three are `tsx`/Node ESM-CJS interop friction between Payload's dependencies and however each command loads `payload.config.ts`:

- `npm run seed` (`tsx seed/index.ts`, tsx's CLI/CJS-register path — the only mode that correctly resolves this project's `@/*` tsconfig alias, used throughout `payload.config.ts` and every collection): crashes with `Cannot destructure property 'loadEnvConfig' of 'import_env.default'`. `@payloadcms/db-postgres` → `@payloadcms/drizzle` eagerly imports `payload/node`'s `loadEnv.js` for a migration-dir helper; that file has `import nextEnvImport from '@next/env'` at its top level, and tsx's CJS transform of this ESM-syntax file produces an interop wrapper that expects `@next/env`'s CJS export to have a `.default` — it doesn't, so the wrapper is `undefined`. Confirmed independent of `dotenv` (also genuinely missing as a dependency — fixed separately) by reproducing the identical crash from a two-line repro file. A `require.cache` pre-seed via `node --require` (which works in principle — Node's CJS loader does check the cache by resolved path before re-requiring) did not resolve it either, for a reason not fully pinned down before deprioritizing this.
- `payload generate:types` / `generate:importmap` / `migrate` in their default mode (`payload`'s own CLI, `node_modules/payload/bin.js` — uses tsx's ESM `tsImport()` API instead of the CJS register path, specifically to *avoid* the bug above): crash instead with `ERR_REQUIRE_ASYNC_MODULE: Cannot use require() on an ESM graph with top-level await`, from `@payloadcms/richtext-lexical`'s dist build. Same root shape as the seed script's bug — something in the chain downgrades an `import` to a `require()` where it shouldn't.
- The same commands with `--use-swc` (`@swc-node/register`, a genuinely different transpiler): get past that crash but then fail to resolve `@/*` aliases at all (`Cannot find package '@/collections'`) — the same limitation that rules out `tsImport` for the seed script.

So every available loader mode has exactly one blocking bug, and no combination avoids all of them. Only `next dev`/`next build` are unaffected (Turbopack/SWC, no tsx involved) — confirmed extensively this session against a real Neon Postgres instance. Payload's dev-mode schema **push** (automatic, no migration needed) is what every bit of manual testing in this repo has relied on so far.

**Practical impact:** seed content manually through the admin UI instead of `npm run seed`. `generate:types` not running means `src/payload-types.ts` was never generated (the hand-written `src/types/payload.ts` stands in — see its own comment). **`db:migrate` not running is the one with real production stakes** — a live deploy needs actual migrations, not dev-mode push. Revisit with a different tsx version, or by running these operations from inside the already-working Next.js runtime (a temporary authenticated API route hit from `next dev`/`next start`, or a custom script that loads `payload.config.ts` via Next's own SWC pipeline instead of tsx) rather than as standalone scripts.

`generate:importmap` not running turned out **not** to matter in practice: Payload's Next.js plugin regenerates `src/app/(payload)/admin/importMap.js` on its own whenever `next dev`/`next build` runs (via SWC/Turbopack, unaffected by the tsx issues above) — no CLI command needed. The real bug was that this project's `admin/[[...segments]]/page.tsx` imported a stray, permanently-empty `(payload)/importMap.ts` stub instead of the auto-generated `admin/importMap.js` sitting right next to it, so the dashboard's collection-cards widget could never find its components (`getFromImportMap: PayloadComponent not found... @payloadcms/next/rsc#CollectionCards`) no matter how many times Payload regenerated the real file. Fixed by pointing both `page.tsx` and the new `(payload)/layout.tsx` (see below) at `./admin/importMap` and deleting the stub.

**Untranslated localized slugs 404 on non-default locales — site-wide, not Guide-specific.** Found while verifying the Guide slice's `/ar/...` rendering: `getPillarBySlug`/`getServiceBySlug` (and now `getGuideTopicBySlug`/`getGuideArticleBySlug`, same pattern) query `where: { slug: { equals: slug } }` scoped to the request locale. Payload's Postgres adapter stores each locale's value in its own row, so if a document's `slug` field was only ever filled in for German, the `ar`/`en` locale row simply has no `slug` value to match — the WHERE clause finds nothing and the page 404s, regardless of `fallbackLocale` (fallback only fills in *returned* fields after a document is already found by id, it doesn't affect this initial lookup). Reproduced against the already-shipped Services slice: `/ar/services/bildung-qualifizierung` is a genuine 404 today, not just a Guide gap. Index/list pages are unaffected — they render the fallback German text fine (confirmed for `/ar/guide` and `/ar/services`), only slug-keyed detail routes break. Real fix (not attempted — out of scope for a single slice): resolve slug-to-id independent of locale (e.g. an unlocalized slug field, or a locale-agnostic lookup that then re-fetches with the request locale for display).

**The admin panel didn't work at all before this session** — three separate, compounding bugs, found by actually logging in against a real database for the first time:
1. No `(payload)/layout.tsx` existed. Payload's Next.js integration requires one wrapping children in `RootLayout` from `@payloadcms/next/layouts` (config/importMap/serverFunction) — without it, every admin context hook (`useConfig`, `useTheme`, etc.) returns `undefined`, and the very first screen anyone would see (`/admin/create-first-user`) crashed outright with `Cannot destructure property 'config' of 'se(...)' as it is undefined`.
2. Adding that layout then collided with the shared `app/layout.tsx`: Payload's `RootLayout` renders its own `<html>`/`<body>`, and the shared root also did, producing `<html> cannot be a child of <body>` and a hydration error on every admin page. Fixed per Next.js's "multiple root layouts" pattern — deleted `app/layout.tsx` and moved `<html>`/`<body>` into `[locale]/layout.tsx` (which now sets `lang`/`dir` directly from the route's locale instead of patching them in via a pre-hydration script, since it has that value server-side already).
3. The importMap bug above, on top of both.
Each was invisible without a live database and a browser — build/typecheck/lint stayed green throughout.
