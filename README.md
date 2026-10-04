# SVÖ Website

The public website for **SVÖ — Syrischer Verband in Österreich** (الاتحاد السوري في النمسا),
a registered association serving the Syrian community across all nine Austrian Bundesländer.

*Bauen. Verbinden. Umsetzen.* — نبني · نربط · ننفذ

Next.js (App Router) with Payload CMS running in the same process, trilingual (German default,
Arabic, English), built so the same content API can serve a mobile app later without a rewrite.

For the full background, locked client decisions, and scope, see
[`SVOE_PROJECT_BRIEF.md`](./SVOE_PROJECT_BRIEF.md). For the "why" behind non-obvious technical
choices, see [`DECISIONS.md`](./DECISIONS.md). For what placeholder content still needs to be
replaced before launch, see [`CONTENT-NEEDED.md`](./CONTENT-NEEDED.md). For features the client
asked about but that are deliberately not built yet, see [`PHASE-2-SCOPE.md`](./PHASE-2-SCOPE.md).

**Production domain:** `syrischerverband.at`, owned by the association
(`BRIEF-AMENDMENT-03.md` §2.7). Production deploys need exactly one env var set —
`NEXT_PUBLIC_SERVER_URL=https://syrischerverband.at` — for canonical URLs and `hreflang`
alternates to resolve correctly; neither is hardcoded to any other host in the codebase.
(A `sitemap.xml`/`robots.txt` route does not exist yet — see `DECISIONS.md` "Known issues".)

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Payload CMS 3.88**, embedded in the Next.js app — admin panel, field-level localisation,
  draft/review/publish workflow, REST + GraphQL API
- **PostgreSQL**, via `@payloadcms/db-postgres` (Drizzle ORM)
- **next-intl** for URL routing (`/de`, `/ar`, `/en`) and UI strings; Payload's own localisation
  for content fields
- **Tailwind CSS v4** (CSS-first config, logical properties for RTL)
- Self-hosted fonts (Inter, Cairo) and self-hosted cookie consent
  (`vanilla-cookieconsent`) — no third-party scripts that set cookies before consent

## Prerequisites

- Node.js **20.9+**
- A PostgreSQL database (local install, Docker container, or a hosted instance)

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
|---|---|
| `DATABASE_URI` | Postgres connection string |
| `PAYLOAD_SECRET` | Long random string (min. 32 chars) — signs Payload's sessions |
| `NEXT_PUBLIC_SERVER_URL` | Public base URL, e.g. `http://localhost:3000` in dev |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outgoing mail (board notifications, contact form forwarding) |
| `EMAIL_FROM` | From-address for system emails |
| `BOARD_NOTIFICATION_EMAIL` | Comma-separated list — emailed when content moves to "in review" |
| `CONTACT_FORWARD_EMAIL` | Where contact form submissions are forwarded |

Then, with a database reachable at `DATABASE_URI`:

```bash
npm run dev
```

The site runs at `http://localhost:3000/de` (also `/ar`, `/en`). The admin panel is at
`http://localhost:3000/admin` — in development the first visit prompts you to create the initial
user, which is always an `admin`. A production build never does this; see
[First administrator](#first-administrator).

To see a populated site instead of empty collections, run the seed script once the database
schema exists (Payload creates it automatically on first run in dev):

```bash
npm run seed
```

This seeds `SiteSettings`, `Navigation`, the four service pillars, and news/event categories with
realistic German content (translated where the seed script provides it). It does **not** seed
News, Events, Board Members, or Partners — that content needs to come from the SVÖ team; see
`CONTENT-NEEDED.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run a production build (`build` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the whole repo |
| `npm run seed` | Populate the database with starter content (see above) |
| `npm run create-admin` | Create the first administrator on an empty `users` table (see [First administrator](#first-administrator)) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` from the current collection config (requires a connected DB) |
| `npm run generate:schema` | Regenerate the GraphQL schema |
| `npm run db:migrate` | Run pending Payload/Drizzle migrations |
| `npm run db:migrate:create` | Create a new migration from schema changes |

Run `typecheck` and `lint` before committing — both are expected to be clean; the build should
never be broken on `master`.

## Project structure

```
src/
  app/
    (payload)/admin/       Payload's admin UI (route group, isolated from the public site)
    (payload)/api/         Payload's REST/GraphQL API
    [locale]/               Public site — every route lives under /de, /ar, /en
  collections/             Payload collections (News, Events, Services, Users, ...)
  globals/                 Payload globals (SiteSettings, Navigation)
  blocks/                  Page-builder block schemas (Hero, CardGrid, ContactBlock, ...)
  components/
    blocks/                 Renderers for each block schema, used by BlockRenderer
    ui/, layout/            Shared UI (Header, Footer, ContactForm, ...)
  fields/                  Reusable Payload field definitions (seoGroup, bundeslandField)
  hooks/                   Payload collection hooks (board notification email, revalidation)
  i18n/                    next-intl routing config, request config, typed navigation
  lib/                     Data-fetching (queries.ts), Payload client, SEO/JSON-LD helpers
  messages/                UI translation strings (de.json, ar.json, en.json)
  types/                   Hand-written types mirroring the Payload schema (used until
                           `npm run generate:types` is run against a live DB)
proxy.ts                  Next.js proxy (formerly "middleware") — drives locale routing
seed/                      Seed script
migrations/                 Payload/Drizzle migrations — committed, not gitignored
```

## Internationalisation

- Locales: `de` (default), `ar`, `en` — every route is prefixed (`/de/...`, `/ar/...`,
  `/en/...`).
- German gets German URL segments (`/de/nachrichten`); Arabic and English share English-language
  segments under their own prefix. See `src/i18n/routing.ts` for the full path map.
- Missing Arabic/English content falls back to German (`localization.fallback: true` in
  `payload.config.ts`) rather than showing an empty page; the frontend shows a small notice when
  this happens.
- `dir="rtl"` / `lang="ar"` apply only to the Arabic locale.

## Admin panel

Roles: `admin`, `board`, `editor`, `viewer`. Editors can create and edit content but cannot
publish; moving an item to "in review" emails the board (`BOARD_NOTIFICATION_EMAIL` and/or
`SiteSettings.boardNotificationEmails`, deduplicated). Only `board` and `admin` can publish.
The admin dashboard itself (not just field labels) is available in German, Arabic, and English —
each admin user can switch it from their account page.

## Deployment

Not yet finalised — the app is built deployment-agnostic. Per `SVOE_PROJECT_BRIEF.md`, the two
candidates are a small EU VPS (Docker) or Vercel + Neon, both pinned to an EU region for DSGVO
reasons. Media currently lives on local disk (`public/media/`); switching to S3-compatible
storage later only requires adding `@payloadcms/storage-s3` and the `MEDIA_S3_*` env vars — no
application code changes.

Whatever the target, the release steps are:

```bash
npm run build
npm run db:migrate     # apply any pending migrations before starting the new build
npm run create-admin   # first release only — see "First administrator" below
npm run start
```

`PAYLOAD_SECRET` must be set (32+ random characters) for both `build` and `start`; a production
process refuses to run with a missing, short or placeholder secret.

### First administrator

A production build answers `POST /api/users/first-register` with **403**, always — otherwise
whoever reaches a freshly deployed site first could make themselves administrator. The first
account is created from the command line instead, **before the site is announced**:

```bash
# against the production database: set DATABASE_URI in this shell first
npm run create-admin
```

It asks for email, display name and password (not echoed, 12+ characters), then:

- acts **only if the `users` table is empty** — on any other database it prints `skipped` and
  changes nothing, so it is safe to re-run;
- always creates an `admin`;
- never prints or logs the password.

It works by booting a temporary server on `127.0.0.1:3998` with `CREATE_ADMIN_ON_BOOT=1`
(`src/instrumentation.node.ts`) — the same pattern as `npm run seed`. Where no shell is available
next to the app, set `CREATE_ADMIN_ON_BOOT=1`, `CREATE_ADMIN_EMAIL`, `CREATE_ADMIN_PASSWORD` and
`CREATE_ADMIN_NAME` in the environment for **one** boot of the production server, check the log
for `[create-admin] created administrator …`, then remove all four again.

After that, further users are created in the admin panel (System → Users). The last remaining
administrator cannot be deleted; keep two admin accounts so a lost password does not lock
everyone out. There is no self-service recovery if the only admin loses access — contact the
developer: **[developer contact — fill in before handover]**.

## Backup & restore

**Database:** standard `pg_dump` / `pg_restore` (or your hosting provider's managed backup) —
there is nothing Payload-specific about the schema.

```bash
pg_dump "$DATABASE_URI" -Fc -f backup.dump
pg_restore -d "$DATABASE_URI" --clean backup.dump
```

**Media:** back up `public/media/` alongside the database (they're not restorable independently —
`Media` documents reference files by path). If/when storage moves to S3, back up the bucket
instead and the local folder becomes unnecessary.

Take both backups together — a DB restore without the matching media files leaves broken image
references, and vice versa.
