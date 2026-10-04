# Launch checklist

**As of:** 2026-10-04, branch `launch-hardening`.
**Verdict: not ready for a public launch.** The code is close; the content and the deployment are not.
Everything below still stands between this repository and a public `syrischerverband.at`. Items are
split by who has to act. Optional improvements are listed separately at the end of section 1.

Sources: this session's work and its three independent reviews (see "Verification"), `QA_AUDIT.md`,
`SECURITY_REMEDIATION.md`, `CONTENT-NEEDED.md`, `DECISIONS.md`.

## 0. Do this first

**Every build before commit `d43eeb9` (S21) let anonymous callers read and overwrite user accounts**
(`GET /api/users` listed every account; an anonymous bulk `PATCH /api/users?where[…]` could set any
account's password — reproduced on the test database: old password rejected, attacker's accepted).
That includes `master` as it stands today. It is fixed on `launch-hardening`.

- [ ] If any build of `master` was ever reachable from the internet (a preview deployment counts):
      change every admin password, check the `users` table for accounts or email addresses nobody
      recognises, and set a new `PAYLOAD_SECRET` (signs out every session).
- [ ] Do not deploy `master` until `launch-hardening` is merged.

## 1. Code

### 1.1 Must be fixed or consciously accepted before launch

| # | Item | Why it blocks | Size |
|---|---|---|---|
| C1 | **`?draft=true` gives anonymous callers rows from the versions tables** (found by the security review, not fixed). The read rule only checks `reviewStatus = published`, and with `draft=true` Payload applies it to the *latest version* instead of the live row | Two leaks. A draft that the board saves over a live document keeps `reviewStatus = published`, so its unreviewed text is public. And versions whose document was deleted directly in the database stay readable (`id: null`) — on the current database `GET /api/jobs?draft=true` returns 27 rows against 4 without it, including leftover test rows. Fix: ignore `draft` for anyone below editor (a `beforeOperation` hook on the eight reviewed collections) or add `_status = published` to `readPublishedOrEditorPlus`; delete version rows with no parent. Needs regression tests like S6. | 2–3 h |
| C2 | **Rate limiting is in-memory and keyed on `X-Forwarded-For`** (QA S11) — contact form and expert application | On Vercel or any multi-instance host each instance has its own counter, and the header is caller-controlled unless the platform overwrites it. The contact form sends a real email per submission, so this is the spam path. Needs a shared store (Upstash/Redis) or a platform rule. | ½ day |
| C3 | **Unbounded public REST queries** (QA S15) — `GET /api/guide-articles?limit=100000&depth=10` answers 200, `pagination=false` is accepted | Cheap way to load the database from outside. Needs a `maxDepth` and a limit cap. | ½ day |
| C4 | **`GET /api/media` lists every upload** (QA S18), and `Media` accepts `image/*`, which includes SVG | Anything uploaded is enumerable. An SVG opened directly runs script on the site's origin (needs an editor account); `/media/*` only carries `frame-ancestors`. Restrict the list endpoint, exclude `image/svg+xml`. | 2–3 h |
| C5 | **Retention settings are stored but nothing reads them** (QA S19) — `submissionRetentionMonths`, `expertApplicationRetentionMonths` exist only in `src/globals/SiteSettings.ts` | The Datenschutzerklärung will promise a retention period the system does not enforce. Build the deletion job, or have the board delete by hand on a schedule and say so. | ½ day, or a process |
| C6 | **Notification emails put user input into HTML unescaped** (QA S9, `src/lib/contactAction.ts`) | Contact-form text lands in the board's inbox as HTML. | 1–2 h |
| C7 | **The expert application has no length limits** (QA S12) | The contact form got them; this form still relies on Payload's 40,000-character default per field. | 1 h |
| C8 | **The last administrator can still be demoted** | This session blocks *deleting* the last admin. Changing the last admin's role is not blocked, and with first-register closed in production the only way back is direct database access. | 1 h (+ tests) |
| C9 | **Other URL fields are not scheme-checked** — `events.registrationUrl`, `jobs.applyUrl`, `officialSourceUrl` (guide, roadmaps), `partners.url`, links in `SiteSettings` and the page blocks | S16 was fixed for the one field the public can write (expert `website`). These are editor/board-only and React blocks `javascript:`, but `data:` and others pass. `validateExternalUrl` / `safeExternalUrl` (`src/lib/safeUrl.ts`) are ready to reuse. | 2 h |
| C10 | **No `sitemap.xml`, `robots.txt` or favicon** — all three answer 404 on the production build | Launch basics. The favicon needs the logo the board still owes; each miss also costs a 77 KB 404 page. | 2–3 h |
| C11 | **CSP path rule is a prefix match** — `/administrator` or `/apiary` (404 pages) get no policy | Harmless today (no such routes), wrong by construction. Use `/((?!(?:admin|api|media|_next)(?:/|$)).*)` in `next.config.ts`. | 15 min (+ test) |

Found by the functional and accessibility review on the production build — **none of these is fixed**
(they arrived too late in the session to change and re-test):

| # | Item | Where | Size |
|---|---|---|---|
| F1 | **`/ar/contact` scrolls sideways by about 10,000 px.** The honeypot field is hidden with `absolute -left-[9999px]`, which in a right-to-left page becomes scrollable overflow (measured scrollWidth 11059 against 1060). Use `-start-[9999px]` or clip-based hiding. | `src/components/ui/ContactForm.tsx:63`; same pattern in `ExpertApplicationForm.tsx:55` (not measured) | 10 min + test run |
| F2 | **The German header is wider than the window** at 1075 px (scrollWidth 1167): the page scrolls sideways and the language switcher is cut off. From the measured widths this holds from 768 to about 1340 px. Arabic fits. Show the hamburger menu below `xl`. | `src/components/layout/Header.tsx:142` | 1–2 h, needs a visual check |
| F3 | **Unknown URLs answer wrongly.** `/de/does-not-exist` gets Next's bare English 404 with no header or footer. Unknown slugs under news, events, experts and guide articles answer **200** with only "Loading…" in the HTML (a soft 404 for search engines); roadmaps, jobs and services answer 404 correctly. The localised 404 page has an empty title. Add `[locale]/[...rest]` calling `notFound()`, keep `loading.tsx` off the `[slug]` routes. | `src/app/[locale]/**` | 2–3 h |
| F4 | **Contact form fields have no programmatic label** (`<label>` without `htmlFor`, inputs without `id`; 8 of 10 in the expert form too). The success panel has no `role="status"`; errors are one generic alert without `aria-invalid`. A screen-reader user cannot tell the fields apart — and the site owes a Barrierefreiheitserklärung. | `ContactForm.tsx:194`, `ExpertApplicationForm.tsx` | 1–2 h |
| F5 | **"Ressourcen" menu:** declares `role="menu"` but has no arrow-key support, no `aria-controls`, and Escape from inside it drops focus to `<body>`. Make it a plain disclosure and return focus to the button. | `Header.tsx:56-88` | 1 h |
| F6 | **Hero search field** has no label, and `focus:outline-none` removes its focus ring with nothing in its place. | `src/components/home/HeroSection.tsx` | 20 min |
| F7 | **72 of 201 pages have no `<h1>`** (the index pages; `SectionHeader` defaults to `h2`). The desktop nav landmark is named "Startseite". "Loading…" is hard-coded in English. | `SectionHeader.tsx:9`, `Header.tsx:142`, `Skeleton.tsx:68` | 1–2 h |
| F8 | **Placeholder pages are live in all three languages:** Impressum, Datenschutz and Barrierefreiheit show "⚠ Inhalt ausstehend …" and have no `<title>`; the About page shows a German developer note ending "Slug: about" and is the first link in the header; the contact form's consent checkbox links to the empty privacy policy; `/de/partner` is an empty state. | content (section 2) — or unlink until it exists | board |

### 1.2 Known limits of what was done in this session

- **CSP on the public site keeps `'unsafe-inline'`** for scripts and styles. A nonce would force every
  page to render dynamically and switch off ISR. The policy still blocks every foreign origin, plugins,
  framing and form targets — but it is not a defence against an inline-script injection.
- **`/admin` is Report-Only** with no reporting endpoint: violations only show in the browser console.
  Before enforcing it, someone has to click through the admin (edit, rich text, upload, Blob upload on
  Vercel) with the console open. Only `frame-ancestors 'self'` is enforced there.
- **HSTS** is `max-age=63072000` without `includeSubDomains` or `preload`. Adding either is a decision
  about every subdomain of `syrischerverband.at`, not about this app.
- **`npm run create-admin`:** the boot flag behind it is tested on a production build; the interactive
  prompt of the launcher itself was only checked for its two refusal paths, never run to completion.
  It is not safe against two simultaneous runs (count, then create) — run it once.
- **Admin panel in a real browser:** load, login, dashboard, edit view, save and image upload were
  checked over HTTP against a production build on a disposable database
  (`qa/security/prod-build.test.ts`). Nobody has clicked through it in a browser as viewer or editor
  since S6/S7 changed what those roles see. New in S21: a non-admin's user list now shows their own
  account instead of an error.
- **Expired sessions are not rejected server-side** (QA N1, Payload behaviour).
- **A bad `PAYLOAD_SECRET` in production answers 500 but does not exit the process** — a health check
  has to catch it (section 3).
- `GET /api/access` tells anonymous callers the full schema, private field names included.
- `generate:types` still does not run; `src/types/payload.ts` is hand-maintained.

### 1.3 Product decisions hiding in the code

- **Unverified experts can be published** (QA S20) — a warning, not a rule. The board should decide.
- **Quiz, search and the app band** (added in 9ddbf52) — each needs a keep / change / remove decision:
  - **Quiz** (`/de/meine-situation`, linked from the homepage band "Fragen beantworten →"): contradicts
    both amendments — AMENDMENT-02 §2.4 says to omit the quiz CTA band, AMENDMENT-03 §3 parks the quiz
    as content-blocked. Its results reach four *sample* roadmaps; the family, health and studying
    answers match nothing; "experts near you" are four "Muster (Beispieleintrag)" entries.
  - **Search** (`/de/suche`, hero search bar): real, and allowed by AMENDMENT-02 §2.4.1. It matches
    titles only and skips jobs and services, so the placeholder's own examples ("Job", "Expert:in")
    return nothing, as do "Anmeldung", "steuer", "wien". The results page has no search field; `q=%`
    matches everything.
  - **App band** (homepage): contradicts AMENDMENT-02 §2.4 ("one line of text with no badges and no
    buttons"). No store links, but a badge, a phone mock-up and a "Benachrichtigen Sie mich →" button
    that lands on the plain contact page. There is no notify mechanism — a dead end.
- `DECISIONS.md` says the board deletes experts; the code allows only admins to. One of them is wrong.

### 1.4 Performance — measured, none of it blocking

The production build answers every prerendered page in under 16 ms warm on this machine. The review's
five changes, largest measured effect first; only the last is under ten minutes, and it needs the logo:

1. Prerender the four listing pages that are dynamic only because they read `searchParams`
   (news, events, experts, guide topic): 11–15 ms and `no-store` now, against 4.6 ms. 2–4 h, medium risk.
2. Prerender the contact page (reads one query parameter to preselect a category). 15–20 min, low risk.
3. Drop one of the four Inter weights: fonts are 96.7 KB of about 308 KB first-view transfer. Design change.
4. Remove the client-side ICU message formatter (39.8 KB raw / 12.1 KB gzip on every page) with
   next-intl's experimental `messages.precompile`. Unmeasured saving, experimental.
5. Add a favicon (C10).

Also noted: first-load JS is 166–172 KB gzip on every public route; the `/de` HTML is 185 KB raw, 25 KB
gzip, 58 % of it the inlined RSC payload; the server compresses with gzip only, so enable Brotli at the
host; `/api/news?limit=3` took 0.5–1.2 s warm and was not investigated (no public page calls `/api`).
No Lighthouse run (not installed) and no image measurements (the database has no media yet).

## 2. Content the board owes

From `CONTENT-NEEDED.md` — nothing here can be written by a developer.

**Hard blockers (legal):**
- [ ] Impressum (full text; German is the legally binding version)
- [ ] Datenschutzerklärung — must match what the system really does: contact form, expert
      applications and their removal path, cookies, retention periods (C5), hosting provider and region
- [ ] Barrierefreiheitserklärung
- [ ] Written consent on file for every person whose photo or contact details are published

**Hard blockers (the site is empty without them):**
- [ ] Sign-off on all homepage copy in DE / AR / EN — the current text was written by the developer
- [ ] Logo (PNG/JPG) — also needed for the favicon; official address, opening hours, public contact
      email, social links
- [ ] At least 3 news articles and 1 upcoming event
- [ ] Guide topics and articles (14 topics planned), each article with its official source and review date
- [ ] Roadmaps (10 planned) with real steps, authorities and documents
- [ ] Service pillar descriptions and the services under them
- [ ] About page: mission, history, board members with photos and roles; partner logos with permission
- [ ] Removal of all sample and test content from whichever database goes live (see C1: leftover test
      rows are still in the versions tables of the current one)

**Decisions only the board can take:**
- [ ] Who verifies experts, and may an unverified expert be published at all?
- [ ] Who reviews guide articles and roadmaps when their review date passes?
- [ ] Who maintains job postings weekly — or does the jobs page stay a list of links?
- [ ] The mailbox that receives contact-form messages and review notifications
      (`BOARD_NOTIFICATION_EMAIL` is still the developer's address)
- [ ] Which content must exist in all three languages at launch?

## 3. Deployment

- [ ] **Merge and push.** `launch-hardening` is not on `master`, and the push from this session is still
      waiting for a Git sign-in: `git push -u origin launch-hardening`, review, then
      `git checkout master && git merge --ff-only launch-hardening`.
- [ ] **Choose the host.** Vercel + Neon or an EU VPS — still open (`README.md`). It decides C2, media
      storage (`BLOB_READ_WRITE_TOKEN` on Vercel) and how `create-admin` is run.
- [ ] **Production environment variables:** `PAYLOAD_SECRET` (32+ random characters, never the dev one),
      `DATABASE_URI`, `NEXT_PUBLIC_SERVER_URL=https://syrischerverband.at`, `SMTP_*`, `EMAIL_FROM`,
      `BOARD_NOTIFICATION_EMAIL`, `CONTACT_FORWARD_EMAIL`. CI and preview builds need `PAYLOAD_SECRET` too.
- [ ] **Production database in the EU**, all migrations applied — confirm with `PAYLOAD_MIGRATE_STATUS=1`
      against the real connection string, not from memory.
- [ ] **First administrator:** `npm run create-admin` against the production database *before* the URL is
      public, then a second admin account. Check that `POST /api/users/first-register` answers 403 and
      `GET /api/users` answers 403.
- [ ] **Old data:** if the launch database is the current development one, review `contact_submissions`
      created while the REST route was public, delete test accounts, and do section 0.
- [ ] **Domain and TLS** for `syrischerverband.at`; decide the HSTS scope (1.2); Brotli at the host (1.4).
- [ ] **Mail deliverability:** SPF / DKIM / DMARC for the `EMAIL_FROM` domain, then send a real contact-form
      message and a real "in review" notification.
- [ ] **Backups:** scheduled `pg_dump` plus the media store, and one restore actually tried.
- [ ] **Health check / monitoring** on `/api/users/init` (catches the bad-secret case) and on `/de`.
- [ ] **Fill the developer contact** in `ADMIN-HANDBUCH.md` §8 and `README.md` ("First administrator").
- [ ] A browser pass through `/admin` as editor and as viewer on the deployed site, console open.

## Verification

Run on 2026-10-04 against this branch.

| Check | Result |
|---|---|
| `qa: npm run test:p0` | 10 files, 499 tests passed |
| `qa: npm run test:s3` | 3 files, 53 tests passed (S3, S14, production build) |
| `npm run typecheck` / `npm run lint` | exit 0 / exit 0 |
| `npm run build` | exit 0, 185 pages generated |

Three independent, read-only reviews then ran against that production build (`next start`, real
development database, GET requests only).

**Security review.** Read the diffs of 57c0058, 02ccab3, f9a85ed and this branch, and probed S1–S17
anonymously.
- Found **S21** (section 0): anonymous read and bulk update of `users`. Fixed in this session with
  `qa/security/s21-users-access.test.ts`; on the unfixed code 11 of its 20 tests fail, including the
  password overwrite.
- Found **C1** (`?draft=true`). Not fixed.
- Confirmed as still open: S9, S11, S12 (expert form), S15; raised C9 and C11.
- Pass: S1, S2, S3 (code), S4, S5 (code), S7 and S8 (code), S10 (code), S13 (with C11), S14 (code),
  S16 for the public form, S17.
- Not verified, by rule (no writes, no logins against the real database): anything needing POST or
  PATCH, and role behaviour. GraphQL is not mounted (`/api/graphql` answers 404).

**Functional and accessibility review.**
225 distinct URLs fetched (every route in `routing.ts` for
de / ar / en, every homepage link, real slugs down to service detail): all answered 200, no dead links
on the three homepages, no link leaving its locale. The browser console was clean on `/de`, `/ar`,
`/de/kontakt` and `/admin/login` — no Content-Security-Policy violations. Arabic is otherwise sound:
`lang="ar" dir="rtl"`, mirrored header, logical properties, flipped arrows. Defects: F1–F8 above. The
header and the "Ressourcen" menu were a real keyboard test in Chrome; the contact form was a DOM and
code review (nothing was submitted). Not checked: the contact form's error and success flow (needs a
POST), the mobile menu, header overflow at other widths, a visual RTL pass (screenshots failed).

**Performance review.** See 1.4.
