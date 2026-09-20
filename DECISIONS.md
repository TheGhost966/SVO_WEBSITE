# DECISIONS.md

Non-obvious technical decisions, one or two lines each, with the reason.
Future developers and the SVÖ board can use this to understand why things are the way they are.

## Blocked — needs Hamza

**Two missing Guide topics (`BRIEF-AMENDMENT-03.md` §2.4) cannot be created this run.** The
autonomous run's own instructions forbid writing to the Neon database, and the standalone seed
script is broken regardless (`tsx`/ESM-CJS interop bug — see "Known issues"). Proposed
German title/slug for both are in `CONTENT-NEEDED.md`, ready to paste into the admin UI
(`/admin/collections/guide-topics`) — needs a human with admin access and DB write rights.

**Correction (2026-09-20): the pending count was FIVE at the time, not three (a sixth, `unlocalize_events_news_slugs`, was added later the same day).** A read-only
`PAYLOAD_MIGRATE_STATUS=1` against `.env.local` listed all five as `pending`: `initial_schema`,
`unlocalize_reference_slugs`, `add_home_group_site_settings`, `add_home_section_order` (AMENDMENT-03
§2.2), `add_experts_contact_visibility_toggles` (AMENDMENT-03 §2.5). "Three" below and in older
sections predates the AMENDMENT-03 work. The last two were read line by line on 2026-09-20 and are
purely additive in `up()`: `add_home_section_order` = one `CREATE TYPE` + one `CREATE TABLE` (+ FK to
`site_settings` with cascade, two indexes); `add_experts_contact_visibility_toggles` = four
`ADD COLUMN ... boolean DEFAULT false` on `experts`/`_experts_v`. No `DROP`/`ALTER ... TYPE`/data
rewrite in either `up()`; their `down()` drops only what `up()` created. Migrations 1–3 remain
audited in `33e88ad`. Rehearsal on a Neon branch is pending; nothing has been applied to any DB.

**Fresh-database migration run (2026-09-20) — supersedes the rehearsal/baselining plan.** The old
Neon project (AWS US East 2, `ep-icy-violet-aenwmzc4`, built by dev-mode push) held no content worth
preserving, so it was abandoned rather than baselined. A new Neon project was created in **AWS
eu-central-1 (Frankfurt)** — the region move is per brief §16.3 (EU data residency for a DSGVO
association); `.env.local` `DATABASE_URI` now points at `ep-square-dream-b2hnlop9-pooler.c-6.eu-central-1`.
Before migrating, `information_schema.tables` showed **zero tables** in any non-system schema.
- `PAYLOAD_MIGRATE_STATUS=1`: all five `pending`, none applied (`payload_migrations` did not exist
  yet — status now reports that as zero-applied instead of crashing).
- `PAYLOAD_MIGRATE_ON_BOOT=1`: all five ran in order, no errors, **no baselining** — `initial_schema`
  (1301ms), `unlocalize_reference_slugs` (64ms), `add_home_group_site_settings` (78ms),
  `add_home_section_order` (51ms), `add_experts_contact_visibility_toggles` (46ms).
- `PAYLOAD_MIGRATE_STATUS=1` again: all five `✓ ran (batch 1)`; the dev-boot `[schema-warning]` no
  longer fires.
- Schema verified directly in SQL: `site_settings` + `site_settings_locales` carry the `home_group_*`
  columns; `site_settings_home_group_section_order` exists (`_order`, `_parent_id`, `id`, `section`
  enum, `enabled`); `show_email`/`show_phone` on `experts` and `version_show_email`/
  `version_show_phone` on `_experts_v`; `slug` is a plain column on `service_pillars`, `services`,
  `guide_topics`, `guide_articles`, `roadmaps` with no `slug` left in their `_locales` tables
  (`categories`, `events`, `news`, `pages` intentionally keep localized slugs).
- **Slice 0's definition of done (AMENDMENT-02 §2.2) is now genuinely satisfied:** a migration set
  captured from code applied cleanly to a database that never saw dev-mode push. Caveat: this was
  the working database for the project, not a separate throwaway — acceptable only because it was
  empty and brand new.
- **Admin + render verification (2026-09-20, later the same day) — done, against this DB:**
  - `SiteSettings.homeGroup` fields are present and editable in `/admin`. Edited `heroHeadline`,
    saved ("Updated successfully"), and `/de` rendered it. **Revalidate path verified in production
    mode, not just dev:** `next build` + `next start` (port 3200, `NEXT_PUBLIC_SERVER_URL` set to match
    so Payload's CSRF origin check passed) — `/de` was `x-nextjs-cache: HIT`, one save later the first
    request was `MISS` with the new headline, then `HIT` again. An empty `en` field renders the `de`
    text (locale fallback), as expected.
  - `sectionOrder` is a reorderable array (drag handles, per-row "Move Up"/"Add Below"/"Duplicate"
    menu, Visible checkbox). Saved Hero/CTA band/Stats → homepage rendered `hero, ctaBand, stats`;
    "Move Up" on the third row + save → `hero, stats, ctaBand`. **The literal mouse drag was NOT
    verified** — a synthetic drag via browser automation did nothing and froze the renderer; treat
    dnd-kit dragging as untested and "Move Up/Down" as the verified path. Partial lists render only the
    listed sections (unlisted sections are omitted, not appended).
  - The two missing Guide topics were created through the admin UI with de + ar titles:
    `fuehrerschein-verkehr` (Führerschein & Verkehr / القيادة والمواصلات) and `behoerden`
    (Behörden & Ämter / الجهات الرسمية) — unblocks AMENDMENT-03 §2.4's two missing topics; the other
    12 of the 14 launch topics still need creating from the Figma exports. `behoerden` does not appear
    on the Guide index until it has a published article (by design, BRIEF-AMENDMENT-01 §2.8).
  - One test record per content collection (`TEST …`, ids all 1) created via Payload's REST API from
    the logged-in admin session (same access control + hooks as the UI form — **not** typed into the
    UI forms, which dropped the first Save click after programmatic field input): categories,
    service-pillars, services, guide-articles, roadmaps, experts, news, events. Detail + index pages
    return 200 and show the record in de/ar/en for everything except events (below). Expert with
    `showEmail=false` and a `contactEmail` set does not leak the address in any locale. Not created:
    Media/Partners (Partners requires a logo upload), Pages, Board Members (no public page renders
    them). **[DELETED later the same day via `DELETE /api/<collection>/1`; verified 0 rows in every content and `_v` version table. Only the two real Guide topics and the admin user remain.]**
  - **[FIXED the same day — see "Events/News slugs unlocalized" below.]** **Defect found — events slugs were still localized.** `/ar/events/<slug>` and `/en/events/<slug>`
    404 when only the `de` slug is filled, yet the events index in ar/en links to exactly that URL.
    Same bug class AMENDMENT-02 §2.3 fixed for the five reference collections; `events` (and `news`,
    `pages`, `categories`) were left out. News passed in the test only because slugs were set per
    locale. Fix = unlocalize `events.slug` (+ likely `news.slug`) with a migration, or make editors
    fill every locale — a decision, not done.
  - **`board_members.show_email` is inert, not a duplicate of the Experts toggle:** `defaultValue: false`,
    same label idea, but no page or query renders board members at all (nothing in `src/` reads them
    besides the collection/types), so the checkbox gates nothing today. It will only matter once a
    board-members page exists; whoever builds it must honour `showEmail`/`showLinkedIn`.
  - Fixed along the way: none of these needed code changes; test writes to the working DB were reset
    (`heroHeadline` empty, `sectionOrder` empty → default order restored).

**Figma fidelity pass 2 (2026-09-20) — the homepage, header and footer now follow the eleven Figma exports.**
The client said the built site was not close enough to the Figma. Root cause of the biggest gap was not
layout but **fonts: `--font-sans`/`--font-arabic` referenced `var(--font-inter)`/`var(--font-cairo)`, which
nothing defined, so every page rendered in the system serif** (and the `font-sans` class on the layout
wrapper also overrode the Arabic stack). Fixed: real Cairo (arabic+latin) and Inter (latin+latin-ext)
Fontsource subsets in `public/fonts` (OFL, licence texts alongside, unicode-range split so German pages
never fetch Arabic files); stacks now name the families directly; `html[lang=ar]` redefines `--font-sans`.
Then restyled to the frames: header (80px bar, wordmark + association name, blue active link with green
underline), hero (navy→blue gradient, badge pill, large headline, situation chips, example-roadmap card),
white stats strip with large blue numerals, four help cards (first one dark), roadmap cards (step pill, numbered
steps, navy button), 4-column guide tiles, navy experts band + "join the network" panel, job rows, event
cards (tinted header band + date box), news cards (photo or rotating brand gradient), volunteer/idea twin cards,
5-column footer with the nine-Bundesland pill row. Shared `SectionHead` = eyebrow + big title + subtitle +
outlined "view all" button. New strings live in `src/components/home/copy.ts`; the Arabic hero
headline/subline are the Figma's own words, everything else is agent-authored placeholder pending board sign-off.
**Deliberate deviations from the Figma (each has a reason, none is a shortcut):**
- **No hero search field.** The site has no search; a bar that does nothing reads as broken (also the earlier
  Slice 3 ruling). Building a real search is a separate feature — offered, not built.
- **Hero card is an *example roadmap* from the first published roadmap's real steps**, not the Figma's
  logged-in "3 of 6 steps done" card — no accounts or progress tracking exist. Hidden until a roadmap has steps.
- **No login / "join us" account buttons, app-store band, quiz bands, QR/seat counts, filter chips.**
  "Join us" stays a link to the contact form (membership), volunteer/idea link to the contact form with the
  category preselected.
- **Not fabricated:** "+1,200 members", "+250 experts", "+40 articles", "reply within 48 h", job types/employers/
  expiry dates, expert names. Stats keep the real static 9/3/4 tiles (Figma shows four).
- **No logo image** — none exists (CONTENT-NEEDED.md); a wordmark reproduces the Figma's arrangement until the PNG
  arrives. Footer contact details come from `SiteSettings.contactGroup` and are omitted until filled.
- **"Ressourcen" dropdown kept** (AMENDMENT-03 §4).
**German stress-test log (AMENDMENT-03 §4):** (1) header — "Über uns", "Mitglied werden" and the
"Syrischer Verband in Österreich" line wrapped onto 2–3 lines; fixed with `whitespace-nowrap`, tighter link
padding below `xl`, and hiding the tagline below `lg`. (2) hero headline "Alles, was Sie für das Leben in
Österreich brauchen – an einem Ort." runs to three lines at 52px and left "Ort." alone; fixed with
`text-balance`. (3) help-card titles ("Ich suche eine Expertin / einen Experten") and chips wrap to two lines
inside their cards/pills without clipping.
**Also fixed here:** a deleted published item stayed on the public site until its cache entry expired (up to an
hour for roadmaps/experts) because the revalidate hook only ran on save. Added `makeRevalidateOnDelete` and
`afterDelete` to the eight collections that use the change hook.
**UNVERIFIED:** the populated states of roadmaps / experts / events / jobs / news-with-photo sections in all three
locales (the DB is empty, and the admin session needed to add sample records had expired — only news
was seen with data); the mobile-viewport layouts of every restyled section; the footer's legal labels in `/ar` and `/en`,
which are the German words (`legal.impressum/datenschutz/barrierefreiheit` hold German in all three
message files — pre-existing, possibly deliberate since legal texts stay German; the board should decide).

**Media storage for Vercel (2026-09-20).** Deploy target is Vercel (Frankfurt, `fra1`, with the Frankfurt
Neon DB — brief §16.3). Vercel's filesystem is read-only, so `Media`'s `public/media` staticDir cannot
take uploads there. Added `@payloadcms/storage-vercel-blob@3.88.0` (pinned to Payload's version),
configured in `payload.config.ts` with `enabled: Boolean(BLOB_READ_WRITE_TOKEN)` — **unset = local disk as
before** (dev, self-hosting); set = uploads go to Vercel Blob. `clientUploads: true` sends files
browser→Blob so Vercel's 4.5 MB request-body limit doesn't cap photos/PDFs. Companion changes:
`next.config.ts` `images.remotePatterns` now allows `*.public.blob.vercel-storage.com` (was empty, so
next/image would have rejected every Blob URL); `seo.ts` prefers the absolute `ogImage.url` over the
hand-built `/media/<filename>` (wrong under Blob); the handler was **added to
`admin/importMap.js` by hand** because `payload generate:importmap` hits the same tsx/ESM-CJS bug as
`seed`/`generate:types` (`ERR_REQUIRE_ASYNC_MODULE`) — regenerating the map by CLI would work only
after that bug is fixed, and a regenerated map must keep the `VercelBlobClientUploadHandler` entry.
**Verified:** typecheck, lint, and `next build` pass with the token unset and with a dummy token set;
with a dummy token the production server boots, `/admin` and the Media create page return 200, and the
client-upload route is registered (a malformed POST reaches the Blob library's own validation).
**NOT verified:** an actual upload to a real Blob store, and existing-media migration (none exists —
Media is empty). Needs a Vercel Blob store connected to the project (creates `BLOB_READ_WRITE_TOKEN`);
choose the Frankfurt region when creating it.

**Events/News slugs unlocalized (2026-09-20, sixth migration).** The defect above is fixed the same way
AMENDMENT-02 §2.3 fixed the five reference collections: `Events.slug` and `News.slug` are now one
non-localized, `unique` column each. Migration `20260920_001819_unlocalize_events_news_slugs` — generated,
then **hand-edited to backfill from the `de` locale row** before dropping the per-locale columns (the
generated version copied nothing and would have discarded every slug; same reason as migration 2).
Base columns stay nullable because both collections have `versions.drafts`. Applied to the Frankfurt DB
via `PAYLOAD_MIGRATE_ON_BOOT=1` (138ms). Verified on a production build: the seeded test rows' `de`
slugs moved to the base tables; `/de|ar|en` event and news detail pages all return 200 on the one shared
slug; hreflang alternates are built from that single slug for all three locales
(`getNewsAllLocaleSlugs`/`getEventAllLocaleSlugs` were removed — they only made sense for per-locale
slugs). Consequences: the old per-locale news slugs (`test-khabar`, `test-news`) were deliberately
dropped and now 404; editors get one slug per news item/event, not three; `categories` and `pages` still
have localized slugs (categories have no detail route; `pages` is a separate call — only `about`-style
pages exist). **Any long-running `next dev` must be restarted** — it loaded the old config and its
queries reference the dropped column. Total migrations: six (`PAYLOAD_MIGRATE_STATUS=1` → all `✓ ran`).

**Applying the pending migrations still needs an interactive terminal.** Unchanged from the
prior session (see "Unlocalized slugs" → "Exact recovery steps" below) — this run's preflight
re-confirmed all three are still `pending` against `.env.local`'s connection string. Nothing in
this run attempted to change that; it needs the same manual, interactive recovery steps already
documented.

**Board decisions this run surfaced but cannot make:** the Arabic-default-locale question
(§2.3), which locale-visibility default experts should get for §7.4 vs. §7.6 (a policy call, not
a code default), and every row in `PHASE-2-SCOPE.md`'s "Board decision still owed" column
(payment provider, bank account, volunteer-certificate authority, whether CVs get stored at all).

## Assumptions made during the autonomous run (BRIEF-AMENDMENT-03 §5)

Recorded here per the run's own instruction: where a decision wasn't already ruled on in
`BRIEF-AMENDMENT-03.md` §2, pick the cheapest-to-reverse option, do it, and log it. Entries are
added under this heading as the run proceeds; see each numbered work item's own commit/section
below for the technical detail behind each call.

**Fixed `npm run build` (fully broken, pre-existing, not one of the seven numbered work items)
rather than working around it or skipping the build-verification step.** See "`npm run build` was
fully broken" above for the full diagnosis. Chose to fix rather than skip because every later
item's definition-of-done depends on a working build to check against, and the fix (a Turbopack
resolve-alias + a documented instrumentation-file split) is narrowly scoped, reversible, and
touches no application behavior — cheapest-to-reverse option available.

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

## Jobs slice (BRIEF-AMENDMENT-01 Slice 4)

**"Who reviews job postings weekly?" — unanswered, and that's the answer.** §4 requires this
question be answered in `DECISIONS.md` before building the full Jobs collection, and is explicit
that if nobody is assigned, the right move is a curated links page instead. Nobody has been assigned
a weekly review responsibility as of this slice — this is a board staffing decision that can't be
made from inside a coding session. Per §4's own instruction, this slice therefore ships:
`SiteSettings.jobResourceLinks` (a simple admin-editable array of external links to AMS, karriere.at,
willhaben Jobs, etc.) rendered on a plain `/stellenangebote` (de) / `/jobs` (ar, en) page — **not**
the `Jobs` collection with `applyUrl`/`expiryDate`/detail pages/`JobPosting` JSON-LD described in the
brief's original schema sketch. None of §2.4 (detail page), §2.5 (expiry enforcement) apply to this
simpler shape — there's no listing lifecycle to manage, only a hand-curated list of outbound links.

**If the board later commits a named maintainer for weekly review**, that unlocks building the real
`Jobs` collection per the brief's original schema — at that point §2.4/§2.5 become load-bearing
again and should be implemented in full, not retrofitted piecemeal onto this page.

**Route added to "Ressourcen" nav dropdown as a fourth item**, alongside Guide/Roadmaps/Experts —
consistent with the same overflow-avoidance reasoning from the Roadmaps/Experts slices.

**Fixed while building this: `SiteSettings` had no `afterChange` hook at all**, so any edit
(`jobResourceLinks` included) sat on the `getSiteSettings` cache for up to an hour (`revalidate:
3600`) instead of showing immediately — the same class of bug as the missing `guide-topics`/
`guide-articles` cases found during the Roadmaps slice. Added a hook that busts `tags.siteSettings()`
on every change, same as every other publishable collection.

## Unlocalized slugs (BRIEF-AMENDMENT-02 Slice 1)

**`slug` is no longer a `localized` field on `ServicePillars`, `Services`, `GuideTopics`,
`GuideArticles`, or `Roadmaps`** — one URL segment shared by every locale, `unique: true`, exactly
the pattern the Experts slice already used (see "Experts slice" above). This retires the site-wide
untranslated-slug-404 bug (documented under "Known issues" below) at its root for every collection
it affected, rather than filtering teasers to dodge it on a case-by-case basis (§2.3's non-preferred
fallback). `ServicePillars` was added to the amendment's literal list of four — the bug repro
(`/ar/services/bildung-qualifizierung`) is a *pillar* route, not a nested service route, so leaving
pillars out would have left the bug half-fixed.

**Removed, not just unused:** the five `get*AllLocaleSlugs` helpers in `src/lib/queries.ts` and every
caller (`generateMetadata` in the five affected detail pages) that fetched a document a second time
with `locale: 'all'` just to build hreflang `alternates.languages`. With one slug per document, the
current route param *is* every locale's URL segment — no extra fetch needed. Also simplified
`generateStaticParams` in the same five pages from a 3x-per-locale fetch loop to one fetch + a
`flatMap` over the three locales (BRIEF-AMENDMENT-02 §2.7's query-discipline principle, applied here
even though §2.7 itself was written for the homepage).

**`postgresAdapter({ push: false })`** — dev-mode auto-push is now off. Discovered why the hard way:
restarting `next dev` after this schema edit hot-reloaded straight into Payload's dev-push flow,
which detected the change was destructive (dropping the old per-locale `slug` columns) and prompted
*interactively* — `Accept warnings and push schema to database? (y/N)` — which hangs forever against
a backgrounded/non-TTY process, since nothing can answer it. Now that Slice 0 gives this project a
real migration path, dev-push's convenience isn't worth its risk of silently prompting for
destructive changes (or hanging) on every schema edit going forward. All schema changes now go
through `PAYLOAD_MIGRATE_CREATE_NAME`/`PAYLOAD_MIGRATE_ON_BOOT` exclusively — see "Migration path
fix" below.

**The migration needed hand-correction before it could touch real data — this is exactly why
migrations get reviewed before running, not auto-applied.** `createMigration` doesn't know "a field
moved from a per-locale side table to the base table" is one semantic change; it sees an independent
ADD + DROP, so the auto-generated SQL would have (a) failed outright on `service_pillars`/
`guide_topics` — `ADD COLUMN "slug" varchar NOT NULL` with no default, against tables that already
have one row each — and (b) silently left `services`/`guide_articles`/`roadmaps`' new `slug` column
NULL forever, since it never backfilled from the old per-locale data at all. Checked real data first
(`service_pillars`: 1 row, `slug` de-only `bildung-qualifizierung`; `guide_topics`: 1 row, `arbeit`;
`guide_articles`: 1 row, `ams-registrierung`; `roadmaps`: 1 row, `meldezettel`; `services`: 0 rows) —
hand-rewrote `migrations/20260915_104651_unlocalize_reference_slugs.ts` to add each column nullable,
backfill it from the `de` locale row via `UPDATE ... FROM ... WHERE _parent_id = id AND _locale =
'de'`, then set `NOT NULL` only where the migration's own generated `.json` snapshot actually shows
it (see next paragraph), before creating indexes and dropping the old columns.

**Not all five `required: true` slug fields are DB-level `NOT NULL` — and that's correct, not a
bug.** Cross-checked the migration's `.json` snapshot (generated straight from
`generateDrizzleJson(config)`, so it reflects the real target schema Payload wants, independent of
whatever SQL got auto-generated for the diff): `service_pillars.slug` and `guide_topics.slug` are
`notNull: true`; `services.slug`, `guide_articles.slug`, and `roadmaps.slug` are `notNull: false`.
The difference is `versions.drafts` — the latter three have draft/review workflows (`_services_v`,
`_guide_articles_v`, `_roadmaps_v` version tables exist; pillars/topics have none), and Payload
deliberately keeps `required: true` fields nullable at the base-table level for draft-capable
collections, since a draft can legitimately be incomplete — required-ness is enforced at the
application layer only, on publish. The hand-corrected migration matches this exactly.

**Not yet applied to the real working dev database — blocked by this session's own tooling, same as
Slice 0's fresh-database test.** Two more direct-DB-write attempts were declined ("Modify Shared
Resources"): first `CREATE DATABASE` for a throwaway test target (Slice 0), now a two-row
`DELETE`/`INSERT` against `payload_migrations` on the *existing* working database. This project's
`payload_migrations` table already carries Payload's own sentinel row (`name: 'dev', batch: -1` —
written by dev-push itself) marking that this database's schema came from dev-mode push, not
migrations. Running `payload.db.migrate()` against it will hit Payload's own built-in interactive
prompt for exactly this situation ("It looks like you've run Payload in dev mode... data loss will
occur. Would you like to proceed?") — which needs a real TTY to answer, so it must be run from an
actual interactive terminal, not through this session's tooling.

**Confirmed reproducible, not a one-off: BRIEF-AMENDMENT-02 Slice 2 (`SiteSettings.homeGroup`) hit
the identical wall.** Its migration (`add_home_group_site_settings`, purely additive — new nullable
columns and two new child tables, no drops) was generated successfully (filesystem-only, safe), but
running `PAYLOAD_MIGRATE_ON_BOOT=1` against the real dev DB hit the exact same
`payload_migrations.batch = -1` sentinel prompt, backgrounded with no TTY to answer — killed rather
than force-answered, since blindly piping `y` into a schema-migrating process against a shared
database is not a call this session should make unsupervised, and the risk below (baselining) is
real, not hypothetical until proven otherwise. The migration file is committed anyway (matches how
`unlocalize_reference_slugs` was handled) — it's the same *pending-application* state as that one,
now stacked one deeper. **Do not add a fourth migration on top before running the recovery steps
below** — each additional unapplied migration makes the eventual manual recovery larger.

> **HISTORICAL — obsolete as of 2026-09-20.** The baselining/recovery runbook below was written for a
> database built by dev-mode push. That database was abandoned; migrations now apply from zero on a
> fresh Frankfurt database (see the "Fresh-database migration run" record at the top of this file).
> Kept for the record and in case another dev-push database ever needs rescuing —
> `PAYLOAD_MIGRATE_BASELINE` still exists for exactly that. Not needed on the current path.

**Exact recovery steps** (run locally, interactively, in a normal terminal — not backgrounded):
1. `$env:PAYLOAD_MIGRATE_ON_BOOT=1` (PowerShell) or `PAYLOAD_MIGRATE_ON_BOOT=1` prefix (bash), then
   `npm run dev` (or `next build && next start` for a closer-to-prod check).
2. Answer **y** at Payload's dev-mode prompt. This runs all pending migrations in order:
   `initial_schema` will fail if the database already has these tables from dev-push — if so, that
   confirms the database needs baselining first (mark `initial_schema` as already-applied without
   running it, since dev-push already built that schema) before `unlocalize_reference_slugs` and
   `add_home_group_site_settings` can run.
3. Once clean, unset `PAYLOAD_MIGRATE_ON_BOOT` before the next normal boot.
4. Verify: `/ar/roadmaps/meldezettel`, `/ar/guide/arbeit/ams-registrierung`,
   `/ar/services/bildung-qualifizierung` (and `/en/...`) all resolve instead of 404ing — this is the
   actual proof the fix works, not just that the migration ran.
5. Verify the homepage-settings fields too: open `/admin/globals/site-settings`, confirm a
   "Homepage" group with hero/stats/help-card/CTA-band fields appears and saves.

**Rehearse on a disposable copy first — do not answer the prompt against the real Neon DB
directly.** The rest of this subsection is a read-only audit of what the three pending migrations'
`up()` functions actually do, done specifically so that rehearsal has something concrete to verify
against rather than trusting Payload's generic warning at face value.

**Ordering check — does any DROP precede its own backfill?** No, in any of the three files.
- `add_home_group_site_settings.up()`: no `DROP` of any kind — only `CREATE TYPE`, `CREATE TABLE`
  (two new child tables), and `ADD COLUMN` (all nullable, all new columns on `site_settings`). There
  is nothing pre-existing to back up before touching it.
- `initial_schema.up()` (lines 3–1856): pure `CREATE TYPE`/`CREATE TABLE` from an empty schema — zero
  `DROP` statements anywhere in `up()`. Every `DROP TABLE`/`DROP TYPE` in this file (the long list
  starting line 1859) is inside `down()`, the rollback function, which never runs during a forward
  migration.
- `unlocalize_reference_slugs.up()` — the only file that removes existing data-bearing columns.
  Per collection, quoting line numbers:
  - **services**: `ADD COLUMN "slug"` (L25) → backfill `UPDATE "services" ... FROM "services_locales"` (L34-35) → index (L54) → `DROP COLUMN` on `services_locales` (L63)
  - **_services_v** (draft version table): `ADD COLUMN "version_slug"` (L26) → backfill (L36-37) → index (L55) → drop (L64)
  - **service_pillars**: `ADD COLUMN "slug"` (L27) → backfill (L38-39) → `SET NOT NULL` (L51) → index (L56) → drop (L65)
  - **guide_topics**: `ADD COLUMN "slug"` (L28) → backfill (L40-41) → `SET NOT NULL` (L52) → index (L57) → drop (L66)
  - **guide_articles**: `ADD COLUMN "slug"` (L29) → backfill (L42-43) → index (L58) → drop (L67)
  - **_guide_articles_v**: `ADD COLUMN "version_slug"` (L30) → backfill (L44-45) → index (L59) → drop (L68)
  - **roadmaps**: `ADD COLUMN "slug"` (L31) → backfill (L46-47) → index (L60) → drop (L69)
  - **_roadmaps_v**: `ADD COLUMN "version_slug"` (L32) → backfill (L48-49) → index (L61) → drop (L70)

  Every single `DROP COLUMN` is preceded by its collection's backfill `UPDATE`. The file is correctly
  ordered as written.

**What the prompt is actually warning about — Payload's generic warning, not something specific to
these files.** `node_modules/@payloadcms/drizzle/dist/migrate.js` fires this prompt purely because
`payload_migrations` contains a `batch: -1` sentinel row — it never inspects what the pending
migration files contain. Reading `runMigrationFile()` in that same source: each migration's `up()`
runs inside one real Postgres transaction (`initTransaction`/`commitTransaction`/`killTransaction`),
and Postgres (unlike MySQL) supports transactional DDL, so any error anywhere in a 2,000-line file
rolls back the *entire* file atomically — no partial `CREATE`/`DROP` can persist.

Given that, the concrete, non-generic risk in *this* project's case is: **`initial_schema` will
almost certainly fail immediately**, because the live database's tables were already built by
dev-mode push before `push: false` was set — its very first `CREATE TABLE "users"` (or whichever
table dev-push hasn't already got as byte-identical DDL) will raise `relation "..." already exists`,
the transaction rolls back cleanly, and the boot process exits(1) before `unlocalize_reference_slugs`
or `add_home_group_site_settings` even get a chance to run. That failure is not data loss — it's a
clean no-op. The step that actually carries risk is the one this file's recovery instructions gloss
over: to get past that guaranteed failure, `initial_schema` needs to be **baselined** — manually
marked as already-applied in `payload_migrations` (insert `{ name: '20260915_103709_initial_schema',
batch: 1 }`) *without* running its SQL, since dev-push already built that schema by hand-pushing, not
via this file. That manual insert has no automated safety net and is the one step worth rehearsing
on a Neon branch: if the string doesn't exactly match the migration's `name`, or dev-push's actual
schema drifted at all from what this file would have produced, `unlocalize_reference_slugs` could run
against columns/tables that don't look like what it expects.

**If slugs come back empty after migrating, what restores them:** `service_pillars` and
`guide_topics` have `ALTER COLUMN "slug" SET NOT NULL` (L51-52) immediately after their backfill —
if the backfill produced `NULL` for any row (no `de`-locale row existed for it), that `SET NOT NULL`
itself fails, which rolls back the *whole* migration transaction, so the old `_locales.slug` column
is never dropped and no data is lost — the fix is just to make sure every row has a `de` slug filled
in before re-running. **The real risk is narrower and specific to `services`, `guide_articles`, and
`roadmaps`** — these three stay nullable at the DB level (deliberately — see the file's own comment
on `versions.drafts`), so a `NULL` backfill for one of them does *not* error; the migration commits
successfully, the old per-locale column is gone, and that document's slug is genuinely empty with no
DB-level trace of the old value. Recovery in that case: (1) if a Neon branch/snapshot was taken
before migrating (which this rehearsal should do anyway), restore the `*_locales` table from it and
re-run the equivalent `UPDATE ... FROM ..._locales WHERE _locale = 'de'` for just the affected rows;
(2) failing that, re-enter the slug by hand via the admin panel — per `CONTENT-NEEDED.md`, current
row counts are tiny (`service_pillars`: 1, `guide_topics`: 1, `guide_articles`: 1, `roadmaps`: 1,
`services`: 0, and every one of today's rows already has its German slug filled in), so today this
failure mode has zero rows it could actually affect — this is a safeguard for future content, not a
live problem right now.

**Until that's done, this is the current state:** the code is correct and builds cleanly (confirmed:
`npm run build` succeeds, `generateStaticParams` degrades gracefully to zero pre-rendered paths for
the five affected detail routes rather than crashing, since the live DB doesn't have the new `slug`
column yet). But **the real dev database is mid-migration** — it has neither the old localized-slug
shape the running site was built against, nor the new unlocalized shape this code now expects. Guide/
Roadmaps/Services detail pages will 404 or error until the steps above are run. Don't treat a running
`next dev` as a working preview of this slice until that database write happens.

## Migration path fix (BRIEF-AMENDMENT-02 Slice 0)

**`db:migrate` is fixed — not by fixing the CLI, but by not using it.** Per this file's own prior
note under "Known issues" (still accurate for `seed`/`generate:types`), every `tsx`-loaded path to
`payload.config.ts` hits an unfixable interop bug, and only `next dev`/`next build` load the config
successfully (Turbopack/SWC, no tsx). `src/instrumentation.ts` now runs migration operations from
*inside* that already-working pipeline: its `register()` hook fires once per server boot, and —
gated behind explicit opt-in env vars, never automatic — calls the exact same `payload.db.migrate()`
/ `payload.db.createMigration()` / status-read functions that `node_modules/payload/dist/bin/migrate.js`
calls internally. Confirmed by reading that file: the CLI wrapper does nothing but parse args and
call these adapter methods, so calling them directly from a working Next.js boot is equivalent, not
a workaround-of-a-workaround.

**Env vars** (see `.env.example`): `PAYLOAD_MIGRATE_STATUS=1`, `PAYLOAD_MIGRATE_ON_BOOT=1`,
`PAYLOAD_MIGRATE_CREATE_NAME=<name>`. Set one, boot the server once (`next dev` or `next start`),
read the result from the console, unset it before the next normal boot.

**`PAYLOAD_MIGRATE_BASELINE=<name>`** (added for the `initial_schema` situation described under
"Unlocalized slugs"): inserts `<name>` into `payload_migrations` as batch 1 without running its
`up()`, and deletes the `batch: -1` dev-push sentinel row. Use once, for a database whose schema came
from dev-mode push. `<name>` must match the migration file's name exactly (e.g.
`20260915_103709_initial_schema`, no extension). It writes to the DB and is not idempotent — running
it twice inserts a duplicate row — so rehearse on a Neon branch/snapshot first, run it for one boot
only, then unset it and follow with `PAYLOAD_MIGRATE_ON_BOOT=1` for the remaining migrations.

**Why not an HTTP route instead** (the other option this file previously suggested): built first,
then rejected by this session's own security review — a secret-gated endpoint that executes
privileged DB-schema operations on request is a standing network attack surface regardless of how
well it's gated. `instrumentation.ts`'s `register()` has no equivalent surface: it fires once at
process boot, accepts no request, and does nothing unless an operator has explicitly set one of the
env vars for that specific boot.

**What's verified vs. not:**
- `PAYLOAD_MIGRATE_STATUS=1` run against the real working dev database (read-only — lists migration
  files vs. applied state, no writes): confirmed working end-to-end, no tsx crash, correct output
  (`(no migration files found)`, matching the then-empty `migrations/` directory).
- `PAYLOAD_MIGRATE_CREATE_NAME=initial_schema` run the same way generated
  `migrations/20260915_103709_initial_schema.ts` (2,027 lines — the full schema: every collection,
  version/draft tables, all enums). Confirmed this operation is filesystem-only and doesn't touch
  the live database at all: reading `buildCreateMigration.js` shows it diffs the *last saved
  snapshot in `migrations/`* (empty, since none existed) against the config-derived schema — never
  live-DB introspection — so it was safe to run against the working dev DB and would have produced
  the identical file against any DB, including a fresh empty one.
- **[RESOLVED 2026-09-20 — see "Fresh-database migration run" at the top of this file; all five migrations applied cleanly to an empty Frankfurt DB. Original note kept below.]**
- **Not verified: actually applying (`PAYLOAD_MIGRATE_ON_BOOT=1`) this migration against a fresh
  database that's never seen dev-mode push.** This session's own tooling denied the action needed to
  provision a throwaway database to test against (`CREATE DATABASE` on the project's Neon instance,
  flagged "Modify Shared Resources") — correctly: that's a real write to shared cloud infrastructure
  outside this repo, not something to wave through autonomously. Applying the generated migration to
  the *working* dev DB was deliberately not attempted — it already has every table from dev-mode
  push, so a raw (non-idempotent) `CREATE TABLE` migration would fail partway through. **Before a
  real production deploy, run `PAYLOAD_MIGRATE_ON_BOOT=1` once against a genuinely fresh database and
  confirm it succeeds — this is the one piece of Slice 0 still unverified.**

**Does dev-mode schema push race `PAYLOAD_MIGRATE_ON_BOOT`? No — checked the adapter source
directly rather than assuming.** `node_modules/@payloadcms/db-postgres/dist/connect.js:110`:
```js
if (process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {
    await pushDevSchema(this)
}
```
Three independent guards, any one of which fully disables push:
1. **`push: false`** (set on the adapter in `payload.config.ts`, see "Unlocalized slugs" above) —
   makes this condition permanently false. Push cannot fire at all anymore, in any mode.
2. **`NODE_ENV === 'production'`** — `next build && next start` never runs push, *regardless* of
   the `push` config value. This was true before `push: false` was ever added.
3. **`PAYLOAD_MIGRATING === 'true'`** — Payload's own CLI (`payload/dist/bin/migrate.js:36`) sets
   this before `payload.init()`, specifically to prevent this exact race. `instrumentation.ts` now
   sets it too, as a second independent guard alongside `push: false` — belt and braces, matching
   Payload's own convention exactly rather than relying on a single config flag.

Practical upshot: there was never actually a race *in this project's current state* (`push: false`
alone fully prevents it), but before that flag existed, push ran at `payload.init()`/connection time
— i.e. *before* any subsequent `adapter.migrate()` call in `instrumentation.ts` gets a chance to
run — which is the actual mechanism behind the interactive-prompt hang documented under
"Unlocalized slugs" above (a plain `next dev` restart with no `PAYLOAD_MIGRATE_*` var set at all,
reacting automatically to the schema code change). **`npm run build && npm run start` is confirmed
as the closer-to-production path** — recommended for verifying `PAYLOAD_MIGRATE_ON_BOOT` from now on,
since it's what a real deploy actually runs, and it makes guard #2 redundant with #1/#3 rather than
relying on any single one.

## Homepage settings + contact deep-link (BRIEF-AMENDMENT-02 Slice 2)

**`SiteSettings.homeGroup`** added per §3.1 — hero headline/subline/CTA, `statLabels` (label +
source), up to four `helpCards`, and a CTA band. Nothing was seeded: every field is optional with no
`defaultValue`, per §2.8 — the board fills these in through the admin panel once the migration below
is applied; until then the homepage sections built in Slice 3 fall back to in-code defaults, never a
blank band.

**Deviation from §3.1's table, recorded per §2.6:** the CTA-band row groups `ctaBandCtaHref` under
"localized" alongside the other three fields, but `heroCtaHref` in the row above it is explicitly
plain text (not localized). Made both `heroCtaHref` and `ctaBandCtaHref` unlocalized text fields —
an href is a route, not copy a translator edits per language, and every other internal link field in
this codebase (`helpCards[].href`, `jobResourceLinks[].url`, etc.) is already unlocalized. Localizing
it would mean the board maintains three copies of the same path per button, for no benefit.

**`statLabels.source` options are `experts` / `guideArticles` / `roadmaps` / `events`** — the four
collections with a real, queryable count today. The non-count trust signals §2.5 also allows (9
Bundesländer, 3 Sprachen, the four Schwerpunkte, founding year) are static, not DB-backed, so they
don't belong in this select — Slice 3 renders them directly in code instead.

**`src/types/payload.ts`** (the hand-written stand-in for `generate:types` — see "Known issues")
extended with the matching `homeGroup` shape.

**Contact form category deep-link** (§3.2): added `volunteering` and `idea` to the category list
(`membership` already existed) in a new `src/lib/contactCategories.ts` — the single source of truth
both `ContactForm.tsx` (rendering) and `contact/page.tsx` (validation) import from, so the two can't
drift. `contact/page.tsx` reads `?kategorie=` (de) / `?category=` (ar, en) via Next's async
`searchParams`, checks it against `isContactCategory()`, and silently drops anything that doesn't
match — never passed through as free text, per §3.2's requirement. The category `<select>` itself
was already a fixed enum in the UI; `ContactSubmissions.category` is a plain text field in the CMS
(pre-existing, out of this slice's scope) so this doesn't change what gets stored, only what's
pre-selected. Wiring real header/footer/homepage links to `/kontakt?kategorie=freiwillig` etc. is
Slices 3–4, per the amendment's own build order — this slice only adds the capability.

**Migration generated but NOT applied to the real database** — `add_home_group_site_settings` hit
the exact same `payload_migrations.batch = -1` interactive-prompt wall as `unlocalize_reference_slugs`
before it. See "Migration path fix" above for the now-updated recovery steps, which apply all three
pending migrations (`initial_schema`, `unlocalize_reference_slugs`, `add_home_group_site_settings`)
in one interactive session. **The homepage admin fields will not appear until that recovery runs.**

## Process: verify schema-state claims against the actual connection string, not a verbal report

2026-09-16, during Slice 3 kickoff: told the migration was applied and to proceed; ran a read-only
`PAYLOAD_MIGRATE_STATUS=1` check against the connection string actually sitting in `.env.local`
first anyway, and it reported all three migrations still `pending`. The applied-migration claim
turned out to be pointed at a different Neon branch than the one wired up in `.env.local` — caught
before any Slice 3 code was written against a DB that didn't have the schema it would need.

**The pattern worth keeping is the check itself, not this specific mix-up:** a report that schema
state changed (a migration ran, a seed completed, a branch was promoted) gets verified against
whatever this session is actually pointed at before any schema-dependent code is written — never
taken on the reporter's word alone, regardless of who's reporting it or how confident the report
sounds. `BRIEF-AMENDMENT-02.md` §5 now has this as a named preflight step for this slice; the
general version of the habit is: **when what you're about to build depends on external state
(a database's actual schema, a deployed service's actual version, a branch someone says was
merged), check the state directly through whatever read-only mechanism exists before building
against it — a status query, not a status claim.**

## Homepage sections (BRIEF-AMENDMENT-02 Slice 3 / BRIEF-AMENDMENT-03 §5 item 3) — built

**Not started — the plan was approved with two corrections, then paused.** Building against the
real dev database before `PAYLOAD_MIGRATE_ON_BOOT`'s recovery steps (see "Homepage settings +
contact deep-link" above) run would test nothing real: `SiteSettings.homeGroup` doesn't exist in
the DB yet, so every homepage section would silently render its in-code fallback and §2.1 ("copy
editable from admin, not hardcoded") would go completely unverified. Worse, §2.3's own
verification step — click every teaser card on `/ar` and `/en` — is *unverifiable* right now: the
`unlocalize_reference_slugs` migration is also unapplied, so Guide/Roadmaps/Services detail routes
still 404 on every locale regardless of what Slice 3 builds. Migration rehearsal on a Neon branch
is in progress; Slice 3 code starts once that lands on the real dev DB.

**Hero search (§2.4.1): dropped, not deferred as an open design question — revisit only once real
content exists.** With 1 guide topic and 1 roadmap in the DB, a `like` search returns nothing for
almost any query a visitor would type — that reads as a broken feature, not a thin one. The 4 hero
quick-filter chips (real links to Guide topics) carry the hero interaction instead. No `/suche`
route, no search query function to build now — revisit once `CONTENT-NEEDED.md`'s Guide/Roadmaps
gaps are filled, not on a fixed schedule.

**Deleting `getPageBySlug('home')`/`BlockRenderer` from the homepage in Slice 3 makes a `pages`
record with slug `home` permanently inert — and nothing in the schema stops someone from creating
one expecting it to work.** `Pages.slug` (`src/collections/Pages.ts`) is a plain localized text
field: no `unique: true`, no value restriction, no admin-panel warning. Checked whether any other
route consumes it generically — it doesn't: `getPageBySlug` is called from exactly two places in
the whole app, `about/page.tsx` (hardcoded `'about'`) and the home page (hardcoded `'home'`, being
removed in this slice). There is no `[locale]/[slug]/page.tsx` catch-all. So this isn't a gap Slice
3 introduces — a `pages` record with any slug other than `about` is *already* unroutable today —
Slice 3 just moves `home` from "the one fallback path that used it" to fully dead, same as every
other slug. Not fixed now: no board workflow creates arbitrary `pages` records today (every
seeded/test record uses `about`), and a generic page-builder route is out of this slice's scope.
Worth a one-line admin `description` on `Pages.slug` next time that field is touched, warning that
only `about` currently renders.

**Built anyway, despite the preflight showing all three migrations still `pending` — per
`BRIEF-AMENDMENT-03.md`'s explicit autonomous-run instruction ("continue building, but mark every
definition-of-done item that depends on live data as UNVERIFIED — never as passed").** The section
order is `hero, stats, news, events, helpCards, roadmaps, guide, experts, jobs, ctaBand`
(`src/lib/homeSections.ts`'s `HOME_SECTIONS`/`DEFAULT_HOME_SECTION_ORDER`), matching §2.1's
ruling exactly — News and Events kept as two independently orderable/toggleable sections rather
than one combined entry, since they already have separate query functions and separate board
control seems more useful than forcing them to move as a pair.

**New `src/lib/internalHref.ts` (`resolveInternalHref`) — a real bug found and fixed while wiring
`SiteSettings.homeGroup`'s CMS href fields to actual links.** Those fields (`heroCtaHref`,
`ctaBandCtaHref`, `helpCards[].href`) are unlocalized plain text by design (Slice 2), with an
admin description promising "not language-dependent" — but a raw `<a href={value}>` (the pattern
`CardGridBlock` already uses for its own CMS url field) can only ever be locale-correct for AR/EN,
which share English-language route segments; DE alone has different segments
(`/contact`→`/kontakt`, `/services`→`/leistungen`, etc.). A board member typing `/kontakt` (the
admin field's own literal example) would 404 on `/ar` and `/en`; typing `/contact` would 404 on
`/de`. No single raw string is correct on all three locales for routes where DE differs.
`resolveInternalHref(href, locale)` fixes this by treating the stored value as a canonical
pathname key (matching `src/i18n/routing.ts`'s `pathnames`) and resolving it via `getPathname`
from `@/i18n/navigation` — the same routing table `Link` itself uses — falling back to the raw
value unchanged for anything not a recognized key (external URLs, `mailto:`/`tel:`, or a value an
editor already typed as a literal locale-correct segment). Verified in-browser: a `/de` help card
pointing at `/contact` correctly navigated to `/de/kontakt`; the same card on `/ar` navigated to
`/ar/guide` (not `/ar/oesterreich-guide`) for a `/guide`-pointing card. Renders as a plain `<a>`,
not next-intl's typed `Link`, since the resolved value is a runtime string that can't be checked
against `Link`'s literal pathname-key union at compile time.

**Stats band: CMS-configured tiles that don't clear the ≥3 threshold fall back to the static
trio, not to hiding the band** — a refinement of §2.5's literal text ("the whole stats band does
not render") reached during the prior session's planning and re-applied here: an empty stats band
reads as a missing section, not a thin one, so `StatsSection` falls back to the static 9
Bundesländer/3 Sprachen/4 Schwerpunkte trio whenever fewer than 3 dynamic tiles survive —
including when `statLabels` is empty outright, not only when it's fully absent. Founding-year
tile still omitted entirely (not in `CONTENT-NEEDED.md` yet, never invented).

**Roadmaps/Guide/Experts/Jobs teasers always end with a "view all" grid card
(`src/components/home/shared.tsx`'s `ViewAllCard`)** rather than a top-right "see all" link like
News/Events use — real items are capped at 3, with the trailing tile always present regardless of
count, so a thin row (1–2 real items) still reads as a deliberate, complete grid rather than a
broken one. Chose "always show it" over "only show it when there are more items than fit" for
simplicity and because it never produces a dead link — worst case (≤3 total items) it points at a
page showing the same items, which is harmless.

**Old page-builder/pillars-teaser code deleted, not deprecated:** `getPageBySlug('home')`,
`BlockRenderer`, `FallbackHero`, `PillarsSection`, `DefaultCTABand`, and the homepage's
`getServicePillars` call are gone from `src/app/[locale]/page.tsx` entirely, replaced by the
bespoke `src/components/home/*` section components — no Services/Pillars teaser exists on the
homepage at all now, since it isn't one of §2.1's ten sections (Services remains fully reachable
via nav and `/services`, just not featured on the homepage).

**`getRoadmaps`, `getGuideTopics`, `getExperts` gained an optional `limit` parameter**
(BRIEF-AMENDMENT-02 §2.7) — all three previously hardcoded their limit (100/50/100). Existing
callers (the full index pages) are unaffected since the parameter defaults to the same values;
the homepage passes `4` for a capped teaser fetch instead of fetching the (small but unbounded)
full collection and slicing client-side. `getGuideTopics`'s post-filter-by-article-count step
still fetches up to 50 topics before filtering (unavoidable — the limit only determines how many
*survive* the filter, and no batch of fewer than "all of them" can guarantee the requested count
of topics-with-articles), then slices the filtered result to `limit`.

**New `getHomeStatCounts` in `queries.ts`** — four `payload.count()` calls in one `Promise.all`,
never a `find`, per §2.7's "never fetch a full collection to read a count." Not locale-scoped
(a trust-signal total of the association's work, not per-locale content).

**Fixed a pre-existing accessibility bug while touching this code: `SectionHeader` never accepted
an `id` prop, so every homepage section's `aria-labelledby="x-heading"` pointed at nothing** —
`aria-labelledby` requires the referenced `id` to exist on some element; it silently pointed at no
element at all before this fix (screen readers fall back to no accessible name for the section,
not an error). Added an optional `id` prop to `SectionHeader` and wired it through on every
section, old and new.

**Verified live via the dev server against the real dev DB (pending-migration state) on
`/de`, `/ar`, `/en`:** hero/stats/help-cards render correctly with in-code fallback content (no
console errors, no hydration warnings — confirmed via `read_console_messages`); RTL layout on
`/ar` mirrors correctly (nav, text alignment, stat/help-card order); the one real `Experts` record
("Dr. Layla Hassan") renders correctly in its teaser; News/Events/Roadmaps/Guide teasers
correctly render *nothing* rather than crashing, consistent with **UNVERIFIED, not failing** —
the live DB has thin data (News/Events collections likely empty) and, more importantly, the
Guide/Roadmaps collections are mid-migration (their queries hit the same
untranslated/unlocalized-slug schema mismatch documented under "Unlocalized slugs" above), so an
empty teaser here does not indicate a bug in this slice's own code — it cannot be distinguished
from one until the migrations are applied. **Not verified at all** (blocked on live data): editing
`SiteSettings.homeGroup` fields in `/admin` and seeing them reflected on the homepage (the fields
don't exist in the DB yet — see the dev-boot schema warning added in this run's preflight), the
`sectionOrder` admin drag-reorder UI, and whether Roadmaps/Guide teasers render correctly once
real, migrated data exists behind them.

**Long-German-string check (§2.6):** hero headline "SVÖ — Syrischer Verband in Österreich" wraps
to two lines at mobile/tablet widths without overflow or clipping (checked in-browser at the
default viewport); stat labels ("Bundesländer", "Schwerpunkte") and help-card titles ("Kontakt
aufnehmen") fit within their tiles with no truncation. No overflow instances found needing a
layout change — nothing to log here beyond this confirmation.

## Header and footer (BRIEF-AMENDMENT-03 §5 item 4, applying AMENDMENT-02 §2.4)

**Header already had zero dead-end triggers before this item — login and search were never
built, matching §2.4's "delete" rows.** The only actual gap against §2.4's table was "Join us":
not present at all. Added as a real link to `/contact?category=membership` (next-intl's typed
`Link` with a `{ pathname, query }` object — a static literal, so no `resolveInternalHref` needed
here), styled as a small filled-green button in the header's right-side cluster (desktop,
`hidden sm:inline-flex`) and as a plain link in the mobile menu. Verified in-browser on `/de`
(→ `/de/kontakt?category=membership`, "Mitgliedschaft" preselected in the dropdown) and `/ar`
(→ `/ar/contact?category=membership`).

**Found and fixed while touching the header: "Über uns" (About) had no navigation entry
anywhere — not in the header, not in the footer — despite `/about` existing as a real page and
`SVOE_PROJECT_BRIEF.md` §2 decision 3 naming "Über uns" as one of the three most important
sections at launch.** `nav.about` was already a translated message key, just never wired to a
link. Added `about` as the header's first nav item and to the footer's quick-links grid. This
predates this run — not introduced by Slice 3/4 — but it's squarely "header ... navigation" work,
cheap to fix, and left the site's second-most-emphasized section (per the brief's own locked
decisions) unreachable except by typing the URL directly.

**Footer already had none of §2.4's named dead links either** (volunteer, idea, community voice,
digital membership, annual reports, official bodies) — the current footer predates the Figma-era
planning draft those rows describe. Took the amendment's own suggestion ("volunteer and idea may
appear as the real contact links above instead") and added both as real
`/contact?category=volunteering` / `/contact?category=idea` deep-links in the footer's quick-links
list — turns two parked features into two working entries at no scope cost, same pattern as the
header's "Join us."

**Not done — deliberately out of this item's scope:** the Figma export shows a 5-column grouped
footer layout (Community / Services / Union / Contact + brand) and a static 9-Bundesland pill
row. Neither is a dead link or a functional gap — §2.4's table doesn't mention either — so
restructuring the footer into that shape is Figma-fidelity work (§4/§2.6), not a §2.4 requirement,
and wasn't built in this pass to stay scoped to what AMENDMENT-03 §5 item 4 actually asked for.
Worth doing in a future pass if the board wants closer visual fidelity to the reference design.

**Mobile-viewport behavior not independently re-verified in-browser this pass** — the browser
automation's window-resize call didn't reflect in the captured screenshot (a tooling limitation,
not a code issue), so the new "Join us" button and `about` nav item were only visually confirmed
at desktop width. Both reuse the exact same responsive Tailwind classes (`hidden md:flex` desktop
nav, `md:hidden` hamburger, `hidden sm:inline-flex` for the new button) as the pre-existing,
already-working mobile menu, and the "Join us" mobile link was added to that same menu markup —
low risk, but flagged as UNVERIFIED rather than claimed as tested.

## Experts verification warning + admin column + contact-visibility toggles (BRIEF-AMENDMENT-03 §5 item 6)

**Admin list column was already done** — `verificationStatus` has been in `Experts.admin.defaultColumns`
since the original Experts slice; nothing to add there.

**Added `warnIfPublishingUnverified`, a `beforeChange` hook that logs a server-side warning
(`payload.logger.warn`) when a listing transitions into `published` while `verificationStatus`
isn't `verified`** — never throws, never blocks the save, exactly per §2.5's "harden it one notch
without blocking the board." Fires only on the transition (checks `originalDoc.reviewStatus`),
not on every re-save of an already-published-and-still-unverified listing.

**Added `showEmail`/`showPhone` checkboxes (both default `false`)** — see "AMENDMENT-03 rulings"
above for why: the amendment's premise that these already existed was wrong, not its instruction.
Gated the public detail page's existing unconditional `contactEmail`/`contactPhone` rendering
behind them; when both are off, the contact box now shows a "request an introduction via our
contact form" link instead of silently showing nothing. `website` is intentionally left ungated —
the amendment names only `showEmail`/`showPhone`, not a third toggle, and expanding the gate to a
field the instruction didn't name would be scope invention, not a correction.

**Migration generated (filesystem-only, purely additive — two new nullable boolean columns, no
drops) but not applied — stacks behind the four now-pending migrations.**

**Consequence worth flagging clearly, not burying: this change temporarily widened the
"broken until migrated" surface area.** Verified directly (read-only `information_schema.columns`
query against the live DB): `show_email`/`show_phone` don't exist on the live `experts` table yet.
Since Payload's generated query now references these columns, `getExperts`/`getExpertBySlug`
started failing against the live DB the moment this schema change was made — caught by their
existing bare try/catch (same pattern as `getSiteSettings`), so it fails *gracefully* (empty
list) rather than crashing, but it is a real, observed regression versus a moment earlier in this
same session: the one real `Experts` record ("Dr. Layla Hassan") rendered correctly on the
homepage during item 3's verification and stopped rendering (silently, no error) once this item's
migration was generated. This is not a new class of bug — it's the exact same "code schema ahead
of DB schema" situation `SiteSettings.homeGroup` is already in — but it means the Guide/Roadmaps/
Experts/homepage-CMS-copy set of "broken until migration recovery runs" now includes ordinary
Experts browsing too, not just the homepage's new fields. Applying the migration recovery steps
(DECISIONS.md "Migration path fix") fixes all of these at once, in one pass.

## Full /de, /ar, /en pass (BRIEF-AMENDMENT-03 §5 item 7)

**Every top-level route resolves on all three locales — verified directly, not assumed.**
Navigated to all 13 top-level routes (`about`, `news`, `events`, `services`, `guide`, `roadmaps`,
`experts`, `experts/apply`, `jobs`, `contact`, `partners`, `impressum`, `datenschutz`/
`privacy-policy`, `barrierefreiheit`) on `/de`, `/ar`, and `/en` using their correct per-locale
segments from `src/i18n/routing.ts`. Every one returned real content — either a populated page or
a legitimate empty/placeholder state (`⚠ Inhalt ausstehend`, "no news found", etc.) — zero 404s,
zero crashes, across all 39 checks. Detail routes (`news/[slug]`, `guide/[topic]/[article]`,
`roadmaps/[roadmap]`, `services/[pillar]/[service]`, `experts/[slug]`) could not be exercised —
every backing collection is currently empty or (for Guide/Roadmaps/Services) blocked by the
pending `unlocalize_reference_slugs` migration — already tracked, not re-logged here.

**No console errors or hydration warnings** on any page checked (`/de`, `/ar/experts`,
`/en/contact`), confirmed via `read_console_messages` after a fresh navigation.

**Keyboard/ARIA spot-check on the `Header`'s custom `GuideMenu` dropdown ("Ressourcen"/"موارد"):**
opens on click, all four items reachable, `Escape` closes it and **returns visible focus to the
trigger button** (confirmed in-browser — a 3px blue `:focus-visible` outline, from the existing
global `:focus-visible` rule in `globals.css`, appears on the trigger after closing). This
existing behavior (not new in this run) already satisfies AMENDMENT-02 §2.9's accessibility
contract.

**RTL spot-check on `/ar`:** header mirrors correctly (nav order, button positions, dropdown
`start-0` positioning via logical CSS properties), stat-tile and help-card reading order flips
correctly, and — most importantly — the cross-locale link-resolution fix from item 3
(`resolveInternalHref`) was independently re-confirmed here: the homepage's Guide help-card
navigated to `/ar/guide` (not the German `/ar/oesterreich-guide`) with no dead end.

**Long-German-string check, beyond the homepage (already checked in item 3):** header nav labels
render on one line with no wrapping/clipping at desktop width, including the longest item
("Veranstaltungen") alongside the new "Mitglied werden" button and "Über uns"; footer's two-column
quick-links grid handles the newly added "Freiwillige werden"/"Idee einreichen" entries without
layout breakage. No overflow instances found needing a layout change.

**Not verified in this pass (already logged elsewhere, not re-litigated here):** mobile-viewport
rendering (tooling limitation, see "Header and footer" above), admin-panel editability of any
CMS field (blocked on the pending migrations), and correctness of Guide/Roadmaps/Experts detail
pages once real content and a completed migration exist behind them.

## `npm run build` was fully broken — pre-existing, unrelated to any planned work, fixed anyway

Discovered while verifying item 2 (`SiteSettings.homeGroup.sectionOrder`) — the Working
Agreement's "typecheck, lint, build before every commit, never commit a broken build" rule needs
a working build to check against, and `npm run build` failed outright even on unmodified
`master` (confirmed via `git stash`). Fixing it wasn't one of `BRIEF-AMENDMENT-03.md` §5's seven
numbered items, but every later item depends on this gate working, so it was fixed rather than
worked around — cheapest-to-reverse call, logged per the run's own instructions.

**Root cause 1 — Turbopack doesn't resolve conditional `exports` by the `"node"` condition, even
for plain Node-targeted bundles.** `payload`'s own dependency `file-type@21.3.4` ships two entry
points: `core.js` (the `"default"` condition — browser/universal, no `fileTypeFromFile`) and
`index.js` (the `"node"` condition — has it). `node_modules/payload/dist/uploads/getFileByPath.js`
imports `fileTypeFromFile` expecting Node resolution; Turbopack resolves the `"default"`
condition instead and hard-fails at build time (`Export fileTypeFromFile doesn't exist`) — in
**every** bundle category (`Server Component`, `App Route`, `Instrumentation`, `Edge
Instrumentation`), not just edge, ruling out an edge-runtime-only explanation. `serverExternalPackages`
(the documented fix for "Node-specific dependency needs native `require`") does **not** help here
— confirmed empirically (added `file-type` to it, rebuilt, identical failure) — because it only
changes *bundling* behavior, not Turbopack's static named-export validation during the build.
`strtok3` (imported by `file-type/index.js`) has the identical split one level deeper. Fixed via
`next.config.ts`'s `turbopack.resolveAlias`, pointing the bare specifiers straight at the path
Node's own `require.resolve('file-type')`/`require.resolve('strtok3')` already pick — sidesteps
Turbopack's conditional-exports resolution entirely. The alias value must be a project-relative
path (`./node_modules/...`), not an OS-absolute one — an absolute path was silently ignored,
confirmed empirically; mirrors exactly how next-intl's own plugin builds its
`use-intl/format-message` alias.

**Root cause 2 — a runtime `if (...) return` guard inside `instrumentation.ts` does not stop
Turbopack from bundling what follows it for the separate "Edge Instrumentation" target.** Even
with `if (process.env.NEXT_RUNTIME === 'edge') return` as the very first line, `npm run build`
still failed on `sharp` (`non-ecmascript placeable asset` — a native addon can never be
represented in an edge/ESM chunk) with an import trace running straight through
`instrumentation.ts` → `payload.config.ts` → `Media.ts` → `sharp`. A runtime guard only skips
*executing* the code after it; Turbopack still needs the entire reachable module graph to
*compile* for both the Node and Edge instrumentation bundles it always builds, regardless of
whether a runtime check would later prevent that code from running. Fixed by following Next's own
documented pattern exactly ("Specifying the runtime" in the `instrumentation.js` docs): split the
node-only logic into `src/instrumentation.node.ts`, and made `src/instrumentation.ts` a thin
dispatcher that only reaches it via a *separate-file* dynamic `import()` gated on
`NEXT_RUNTIME === 'edge'`. Physically separating the file (not just gating within one file) is
what actually keeps `sharp` out of the edge bundle's module graph.

**Net result:** `npm run build` now exits 0 with zero errors, confirmed after `rm -rf .next` (no
stale-cache false negative). `npm run dev` was never affected by either bug — Turbopack's dev
mode compiles routes on demand rather than eagerly walking the whole graph, which is presumably
why this was never noticed in any prior session's dev-only testing.

## AMENDMENT-03 rulings (client questionnaire)

**Arabic-as-default — open board question, NOT switched.** The brief's six-decisions section
(§2) says German is default; `SVO_Website_Requirements_Questionnaire_AR_final_comprehensive_v2.docx`
§2.1 checks all three locale boxes for a single-answer question, which is self-contradictory, not
a clear instruction to switch. Per `BRIEF-AMENDMENT-03.md` §2.3, the ruling is to keep `de` as
default and record the actual cost of switching, since the architecture is German-first
throughout: `src/i18n/routing.ts`'s `defaultLocale`, every German-language URL segment
(`nachrichten`, `veranstaltungen`, `leistungen`, `kontakt`, `partner`), `localization.fallback`
resolving to German, the SEO canonical/hreflang generation, and every piece of German-first seed/
test content already in the database. None of that is a config-flag flip — switching later means
re-deciding URL segments for `de` (would `de` get the current English-style segments, or would
`ar` take over the German words?), re-pointing `fallback`, and re-auditing every hardcoded
locale-ordering assumption in `queries.ts` and the SEO helpers. This is a board decision, not a
coding one — raised here so the board knows the actual size of "yes, switch it" before answering.

**Jobs maintainer — answered, but this run doesn't act on it.** Questionnaire §8.1: companies
post, admin approves. That names a maintenance model, which is exactly what
`BRIEF-AMENDMENT-01.md` §4 required before building the real `Jobs` collection (see "Jobs slice"
above — the prior ruling was "nobody is assigned, ship curated links instead"). Per
`BRIEF-AMENDMENT-03.md` §2.6, the curated-links page (`SiteSettings.jobResourceLinks`) stays
exactly as-is for this run. What changes is that the collection is now **unblocked in principle**:
whoever picks this up next should build the real `Jobs` collection with `AMENDMENT-01.md` §2.4
(detail page + `JobPosting` JSON-LD) and §2.5 (expiry enforcement) both load-bearing again, not
optional extras. CV upload (questionnaire §8.2) stays parked — see `PHASE-2-SCOPE.md`.

**Experts §7.4/§7.6 contradiction — logged, and one correction to the amendment's own premise.**
Questionnaire §7.4 asks whether expert email/website should be shown publicly; §7.6 asks whether
contact should only go through an admin-mediated request. The document answers **both** yes,
which are mutually exclusive default states for the same contact info.
`BRIEF-AMENDMENT-03.md` §2.5 says to "keep the existing `showEmail`/`showPhone` toggles, default
them off" — but no such toggles exist in `src/collections/Experts.ts` today: `contactEmail`,
`contactPhone`, and `website` are plain fields, rendered on the public detail page (
`experts/[slug]/page.tsx`) unconditionally whenever populated. The amendment's premise was wrong
about the current code, not the instruction — added `showEmail`/`showPhone` checkboxes
(**default `false`**, admin-mediated by default per §7.6) gating the existing render, per §2.5's
actual intent. See "Experts contact visibility toggles" below for the implementation. The board
still needs to pick one policy as the site-wide norm; until then, no new listing shows contact
info unless a board member explicitly turns it on for that person.

**Domain: `syrischerverband.at`**, owned by the association (questionnaire §16.1). Server location
confirmed Austria/EU (§16.3), matching the brief's existing DSGVO hosting constraint — no change
needed there. See `README.md`'s "Production domain" note for the one env var
(`NEXT_PUBLIC_SERVER_URL`) production needs set.

**Discovered while verifying the domain/canonical-URL claim above: no `sitemap.xml` or
`robots.txt` route exists in this codebase at all** (`find src -iname "*sitemap*" -o -iname
"*robots*"` returns nothing). The original brief §3.1 lists both as cross-cutting Phase 1
requirements, not Phase 2+ scope — this is a real gap, not a deferred feature. Not built in this
run (not one of `BRIEF-AMENDMENT-03.md` §5's seven numbered work items, and adding an unplanned
feature mid-autonomous-run risks scope creep the Working Agreement explicitly warns against) —
logged here so it doesn't stay invisible. Also logged under "Known issues" below.

## Known issues

**`generate:types` and `npm run seed` still crash the same way; `db:migrate` no longer does — see
"Migration path fix" above.** Every standalone Payload CLI-adjacent command — `npm run seed`, `generate:types`, `generate:importmap`, `db:migrate` — used to crash the same way. None of these are bugs in this project's schema/config; all three are `tsx`/Node ESM-CJS interop friction between Payload's dependencies and however each command loads `payload.config.ts`:

- `npm run seed` (`tsx seed/index.ts`, tsx's CLI/CJS-register path — the only mode that correctly resolves this project's `@/*` tsconfig alias, used throughout `payload.config.ts` and every collection): crashes with `Cannot destructure property 'loadEnvConfig' of 'import_env.default'`. `@payloadcms/db-postgres` → `@payloadcms/drizzle` eagerly imports `payload/node`'s `loadEnv.js` for a migration-dir helper; that file has `import nextEnvImport from '@next/env'` at its top level, and tsx's CJS transform of this ESM-syntax file produces an interop wrapper that expects `@next/env`'s CJS export to have a `.default` — it doesn't, so the wrapper is `undefined`. Confirmed independent of `dotenv` (also genuinely missing as a dependency — fixed separately) by reproducing the identical crash from a two-line repro file. A `require.cache` pre-seed via `node --require` (which works in principle — Node's CJS loader does check the cache by resolved path before re-requiring) did not resolve it either, for a reason not fully pinned down before deprioritizing this.
- `payload generate:types` / `generate:importmap` / `migrate` in their default mode (`payload`'s own CLI, `node_modules/payload/bin.js` — uses tsx's ESM `tsImport()` API instead of the CJS register path, specifically to *avoid* the bug above): crash instead with `ERR_REQUIRE_ASYNC_MODULE: Cannot use require() on an ESM graph with top-level await`, from `@payloadcms/richtext-lexical`'s dist build. Same root shape as the seed script's bug — something in the chain downgrades an `import` to a `require()` where it shouldn't.
- The same commands with `--use-swc` (`@swc-node/register`, a genuinely different transpiler): get past that crash but then fail to resolve `@/*` aliases at all (`Cannot find package '@/collections'`) — the same limitation that rules out `tsImport` for the seed script.

So every available loader mode has exactly one blocking bug, and no combination avoids all of them. Only `next dev`/`next build` are unaffected (Turbopack/SWC, no tsx involved) — confirmed extensively this session against a real Neon Postgres instance. Payload's dev-mode schema **push** (automatic, no migration needed) is what every bit of manual testing in this repo has relied on so far.

**Practical impact:** seed content manually through the admin UI instead of `npm run seed`. `generate:types` not running means `src/payload-types.ts` was never generated (the hand-written `src/types/payload.ts` stands in — see its own comment). **`db:migrate` — the one with real production stakes — is fixed, see "Migration path fix" above.**

`generate:importmap` not running turned out **not** to matter in practice: Payload's Next.js plugin regenerates `src/app/(payload)/admin/importMap.js` on its own whenever `next dev`/`next build` runs (via SWC/Turbopack, unaffected by the tsx issues above) — no CLI command needed. The real bug was that this project's `admin/[[...segments]]/page.tsx` imported a stray, permanently-empty `(payload)/importMap.ts` stub instead of the auto-generated `admin/importMap.js` sitting right next to it, so the dashboard's collection-cards widget could never find its components (`getFromImportMap: PayloadComponent not found... @payloadcms/next/rsc#CollectionCards`) no matter how many times Payload regenerated the real file. Fixed by pointing both `page.tsx` and the new `(payload)/layout.tsx` (see below) at `./admin/importMap` and deleting the stub.

**Untranslated localized slugs 404 on non-default locales — site-wide, not Guide-specific.** Found while verifying the Guide slice's `/ar/...` rendering: `getPillarBySlug`/`getServiceBySlug` (and now `getGuideTopicBySlug`/`getGuideArticleBySlug`, same pattern) query `where: { slug: { equals: slug } }` scoped to the request locale. Payload's Postgres adapter stores each locale's value in its own row, so if a document's `slug` field was only ever filled in for German, the `ar`/`en` locale row simply has no `slug` value to match — the WHERE clause finds nothing and the page 404s, regardless of `fallbackLocale` (fallback only fills in *returned* fields after a document is already found by id, it doesn't affect this initial lookup). Reproduced against the already-shipped Services slice: `/ar/services/bildung-qualifizierung` is a genuine 404 today, not just a Guide gap. Index/list pages are unaffected — they render the fallback German text fine (confirmed for `/ar/guide` and `/ar/services`), only slug-keyed detail routes break. Real fix (not attempted — out of scope for a single slice): resolve slug-to-id independent of locale (e.g. an unlocalized slug field, or a locale-agnostic lookup that then re-fetches with the request locale for display).

**The admin panel didn't work at all before this session** — three separate, compounding bugs, found by actually logging in against a real database for the first time:
1. No `(payload)/layout.tsx` existed. Payload's Next.js integration requires one wrapping children in `RootLayout` from `@payloadcms/next/layouts` (config/importMap/serverFunction) — without it, every admin context hook (`useConfig`, `useTheme`, etc.) returns `undefined`, and the very first screen anyone would see (`/admin/create-first-user`) crashed outright with `Cannot destructure property 'config' of 'se(...)' as it is undefined`.
2. Adding that layout then collided with the shared `app/layout.tsx`: Payload's `RootLayout` renders its own `<html>`/`<body>`, and the shared root also did, producing `<html> cannot be a child of <body>` and a hydration error on every admin page. Fixed per Next.js's "multiple root layouts" pattern — deleted `app/layout.tsx` and moved `<html>`/`<body>` into `[locale]/layout.tsx` (which now sets `lang`/`dir` directly from the route's locale instead of patching them in via a pre-hydration script, since it has that value server-side already).
3. The importMap bug above, on top of both.
Each was invisible without a live database and a browser — build/typecheck/lint stayed green throughout.
