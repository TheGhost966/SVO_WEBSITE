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

## Media

**Local disk storage (`public/media/`) for Phase 1.**
Simplest option, zero cost, works on any VPS. Phase 2: switch to S3-compatible storage by adding the `@payloadcms/storage-s3` adapter and pointing `MEDIA_S3_*` env vars — no other code change needed.

**Image sizes: thumbnail (400×300), card (768×512), hero (1920×1080).**
Covers the main use cases: news cards, hero sections, thumbnails in admin. next/image handles responsive srcsets from these variants.

## Performance / scalability

**`cache()` wrapper on `getPayloadClient()` in `src/lib/payload.ts`.**
Ensures one Payload instance per request in React Server Components — safe for concurrent traffic.

**ISR with `revalidate` tags** will be added to each page as slices are built.
Tagged revalidation means a news publish only invalidates news pages, not the entire cache.

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
