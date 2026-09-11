# SVÖ Website — Project Brief for Claude Code

> **How to use this file:** put it in the repo root as `PROJECT_BRIEF.md`, start Claude Code in
> that folder, and say: *"Read PROJECT_BRIEF.md. Follow the Working Agreement at the bottom.
> Start with Phase 0."* Do not skip the Working Agreement — it governs how you work.

---

## 1. Context

**Client:** SVÖ — Syrischer Verband in Österreich / الاتحاد السوري في النمسا.
A registered association (Verein) serving the Syrian community across all nine Austrian
Bundesländer.

**Tagline:** *Bauen. Verbinden. Umsetzen.* — نبني · نربط · ننفذ

**What we are building now:** the public website. A mobile app is planned for a later phase
and is explicitly **out of scope** for this repo, but the data layer must be built so an app
can consume it later via API without a rewrite.

**Guiding principle from the client:** the user should not need to already understand the
Austrian system. The site tells them what to do, who is responsible, and where to go next.

---

## 2. Decisions already locked by the client

These came from a requirements meeting. Treat them as fixed. Do not re-litigate them.

| # | Decision |
|---|---|
| 1 | Website now. Mobile app later — build the backend so it can serve both. |
| 2 | **German is the default language.** Arabic and English are fully supported. Language switching must be obvious and one click. |
| 3 | Most important sections at launch: **Über uns**, **News & Events**, **Services & Support for Syrians in Austria**. |
| 4 | Content is written by the SVÖ team. **Final approval by the SVÖ board before anything goes public.** |
| 5 | Launch the first version as fast as possible once content is ready. Professional and practical, **lowest possible running cost**, extendable later. |
| 6 | Final design approval rests with the SVÖ board. |

**What these imply — build accordingly:**

- German-first means **LTR is the default document direction**, and Arabic RTL is the special
  case. Do not build an RTL-first layout and mirror it.
- "Board approval before publishing" is a **hard requirement**, not a nice-to-have. Every piece
  of public content needs a draft → in-review → published lifecycle with role-gated publish
  rights. No editor may publish directly.
- "Lowest possible cost" rules out per-seat SaaS CMS platforms and expensive managed services.
  Self-hostable, open-source, one deployable app.
- "Extendable later" means the big feature set from the original spec (roadmaps, experts
  network, jobs board, ticketing, volunteering, surveys, membership) must be *anticipated in
  the schema and information architecture* but **not built now**.

---

## 3. Scope

### 3.1 In scope — Phase 1 (this build)

**Public pages** (each available at `/de/…`, `/ar/…`, `/en/…`):

1. **Home** — hero, what SVÖ does, the three focus areas, latest news, upcoming events, CTA.
2. **Über uns / About** — mission, history, board members, structure, partners.
3. **News** — index with pagination + filtering by category; article detail pages.
4. **Events** — upcoming and past; event detail page with date, place, category, description.
   Registration is **Phase 2** — for now show a contact/registration link only.
5. **Services & Support** (`/leistungen`) — the association's offerings, grouped. Based on the
   four pillars already in their material: *Bildung & Qualifizierung*, *Sport, Jugend &
   Freizeit*, *Frauen & Familie*, *Recht, Beratung & Services*. Each pillar gets an overview
   page with the individual services underneath.
6. **Contact** — form (name, email, subject, category, message), office details, map embed
   optional, opening hours.
7. **Partners & Supporters** — logo grid with links.
8. **Legal** — `Impressum`, `Datenschutzerklärung`, `Barrierefreiheitserklärung`. Static pages,
   content supplied by the client. Ship with clearly marked placeholders if text is missing —
   **never invent legal text**.
9. **404** and a maintenance/empty state for any section with no content yet.

**Admin / CMS**

- Self-hosted admin panel, German UI by default, Arabic and English UI available.
- Content editable without a developer: all page copy, images, news, events, services, board
  members, partners, navigation labels, footer.
- Per-language content with fallback to German when a translation is missing (see §5).
- Draft / In Review / Published states, version history, and revert.
- Media library with alt text **required per language**.

**Cross-cutting**

- Responsive: 360px → 1920px. Mobile is the primary traffic source; design mobile-first even
  though the reference design is desktop.
- SEO: per-language metadata, Open Graph, `hreflang`, sitemap, robots, JSON-LD for
  `Organization`, `NewsArticle`, `Event`.
- Accessibility: target **WCAG 2.1 AA**. This is not optional — Austrian public funding often
  requires it, and the client may apply for it.
- DSGVO: see §9.

### 3.2 Out of scope — Phase 2+ (design for it, do not build it)

Roadmaps/step-by-step guides · Austria Guide article system · Experts network · Jobs board ·
Event registration + QR check-in · Help-request ticketing · Volunteering + hours tracking ·
Idea submission · Surveys · Digital membership cards · Push notifications · Payments and
donations · User accounts for the public · Mobile app.

**What "design for it" means in practice:** keep the content schema generic (a `Category` model
rather than a `NewsCategory` model), expose content over a versioned REST/GraphQL API from day
one, and don't hardcode navigation.

---

## 4. Technical direction

### 4.1 Recommended stack

Optimised for: one deployable unit, no per-seat licensing, EU hosting, a non-technical admin,
and a straight path to a mobile app later.

- **Next.js (App Router) + TypeScript** — SSR/SSG for SEO and speed.
- **Payload CMS** running inside the same Next.js app — gives the admin panel, field-level
  localisation, draft/publish + versions, role-based access, and a REST + GraphQL API out of
  the box. Open source, self-hostable, no per-editor cost. It directly satisfies decisions
  2, 4 and 5.
- **PostgreSQL** — via the Payload Postgres adapter.
- **Tailwind CSS** — with logical properties so RTL works without a second stylesheet.
- **next-intl** or Payload's own locale routing for the `/de|/ar|/en` prefixes — pick one,
  don't run both.
- **Media** — local disk + a volume, or S3-compatible storage in the EU (Hetzner Object
  Storage, Scaleway). Do **not** default to US-region buckets.

**Deployment target:** a small EU VPS (Hetzner, Nürnberg or Falkenstein) running Docker, or
Vercel + Neon with both pinned to an EU region. Estimate both and let the client choose;
the VPS is meaningfully cheaper at this traffic level.

### 4.2 Before you write code

My knowledge of exact versions and APIs has a cutoff. **Verify current major versions and
breaking changes for Next.js, Payload, and the Postgres adapter against the official docs
before scaffolding.** If Payload's current version does not cleanly support the Next.js version
you pick, say so and propose the alternative (Directus or Strapi as a separate service) rather
than fighting it.

### 4.3 Non-negotiable technical constraints

- No US-only managed services for anything storing personal data.
- No third-party script that sets cookies before consent.
- No Google Fonts loaded from Google's CDN — **self-host the fonts** (this is a known DSGVO
  liability in Austria and Germany).
- No client-side-only rendering of primary content — it must be in the HTML for SEO and for
  screen readers.
- Everything the client can plausibly want to change must be in the CMS, not in the codebase.

---

## 5. Internationalisation — the detail that will break if you rush it

- **Locales:** `de` (default), `ar`, `en`. URL prefix on all three: `/de/ueber-uns`,
  `/ar/من-نحن` (or a transliterated slug — decide and be consistent), `/en/about-us`.
- **Default:** a visitor with no preference lands on `/de`. Detect `Accept-Language` and offer
  a switch, but do not silently redirect away from an explicitly requested locale.
- **Direction:** `dir="rtl"` and `lang="ar"` on `<html>` for Arabic only. German and English
  are `ltr`.
- **CSS:** use logical properties throughout — `ps-*`/`pe-*`, `ms-*`/`me-*`, `text-start`/
  `text-end`, `border-s`/`border-e`. Never `pl-*`, `text-left`, `left-0` for layout that must
  mirror. Icons that imply direction (arrows, chevrons, "next") must flip in RTL; icons that
  don't (calendar, pin, search) must not.
- **Fonts:** Inter for Latin, Cairo for Arabic. Load Cairo only on the Arabic locale.
  Self-hosted, `font-display: swap`, subset where possible.
- **Numbers and dates:** Western Arabic numerals (0-9) everywhere, Austrian date format
  `DD.MM.YYYY`, times in 24h. Do not use Eastern Arabic numerals — the client's own material
  uses Western ones.
- **Fallback:** if an Arabic or English translation is missing, render the German version and
  show a small, non-alarming notice that this content is not yet available in that language.
  Never render an empty page.
- **Untranslatable terms stay German** inside Arabic and English text: *AMS, ÖGK, Meldezettel,
  Ausbildung, Lehre, Anerkennung, Finanzamt, Impressum*. Do not translate them; this is how
  the community actually talks and the client's own documents do exactly this.
- **Slugs** are per-locale and stored in the CMS, so editors control them.

---

## 6. Content model (starting point)

Build these as Payload collections/globals. All text fields localised unless noted.

**Collections**

- `Users` — roles: `admin`, `board`, `editor`, `viewer`. See §7.
- `Media` — alt text required, localised. Caption, credit.
- `News` — title, slug, excerpt, body (rich text), cover image, category (rel), author (rel or
  free text), published date, related Bundesland (optional), featured flag, SEO group.
- `Events` — title, slug, description, cover image, category (rel), start/end datetime,
  location name, address, Bundesland, is-online flag, external registration URL, capacity
  (display only in Phase 1), free/paid label, SEO group.
- `Services` — title, slug, pillar (rel), summary, body, icon, image, contact person (rel),
  target audience, related services, SEO group.
- `ServicePillars` — the four focus areas. Title, slug, description, icon, colour token, order.
- `BoardMembers` — name, role, photo, bio, order, optional email/LinkedIn (visibility toggle).
- `Partners` — name, logo, URL, type (funder / partner / sponsor), order.
- `Categories` — generic, with a `type` field (`news` | `event` | `service`) so one model serves
  all three and Phase 2 features can reuse it.
- `Pages` — flexible page builder for anything not covered above (Über uns, static content),
  using a small set of reusable blocks: Hero, RichText, ImageText, CardGrid, Stats, CTA Band,
  FAQ, LogoGrid, Timeline, Contact Block.
- `ContactSubmissions` — name, email, subject, category, message, locale, timestamp, status.
  Not public. Retention rule — see §9.

**Globals**

- `SiteSettings` — logo, organisation details, contact info, social links, default SEO.
- `Navigation` — header and footer menus, editable, localised labels.
- `Bundeslaender` — the nine states as a seeded reference list (Wien, Niederösterreich,
  Oberösterreich, Salzburg, Tirol, Vorarlberg, Steiermark, Kärnten, Burgenland).

---

## 7. Roles and the approval workflow

This exists because the board must sign off before anything is public.

| Role | Can do |
|---|---|
| `editor` | Create and edit content, upload media, submit for review. **Cannot publish.** |
| `board` | Everything an editor can, plus approve and publish, plus unpublish. |
| `admin` | All of the above, plus user management, settings, navigation, legal pages. |
| `viewer` | Read-only access to the admin panel. |

**Lifecycle:** `draft` → `in_review` → `published` (→ `archived`).

- Publishing is enforced in access control, not just hidden in the UI.
- When an editor moves an item to `in_review`, notify the board by email.
- Version history must let the board see what changed and revert.
- Scheduled publishing is nice-to-have, not required for launch.

---

## 8. Design system

A desktop reference design already exists in Figma (file key `lHoNyg1UtC4mov2N87RAJz`). Use it
for tone and layout, **not** as a pixel spec — it was built Arabic-first and this build is
German-first, so the layout direction inverts.

**Colour tokens**

```
--brand-blue      #0B4EA2   primary, links, headings accent
--brand-navy      #062E57   dark sections, footer
--brand-green     #4FA845   primary action, accent
--brand-green-dk  #3B8A33   text on light green
--brand-green-lt  #EAF4E7   tinted surfaces
--cream           #F7F6F1   page background
--surface         #FFFFFF   cards
--border          #E5E6E0
--ink             #0E1D2B   body text
--ink-70          #4A5C6B   secondary text
--ink-50          #8493A0   meta text
```

Blue and green come straight from the SVÖ logo. Keep green for actions and blue for identity —
don't mix the roles.

**Type**

- Latin: Inter — 400 / 500 / 600 / 700.
- Arabic: Cairo — 400 / 500 / 600 / 700.
- Scale: 12 / 14 / 16 / 18 / 21 / 26 / 32 / 38 / 52. Body 16–17px, line-height 1.6 for German
  and English, **1.8 for Arabic** (Arabic needs more leading to stay readable).

**Layout**

- Max content width 1200px, page gutter 120px desktop / 24px mobile.
- Section vertical padding 84px desktop / 48px mobile.
- Corner radius: 10px controls, 14–18px cards, 20px+ feature panels.
- Borders over heavy shadows. One soft shadow reserved for the hero feature card.

**Voice**

Institutional but warm. Short sentences. Plain German — the audience includes people at A2/B1
level, so avoid Beamtendeutsch even when describing bureaucratic processes.

---

## 9. DSGVO / GDPR requirements

- Cookie consent banner that blocks non-essential scripts **until** consent. Reject must be as
  easy as accept. No pre-ticked boxes.
- Analytics: use a privacy-respecting option (Matomo self-hosted, or Plausible EU). Do not
  install Google Analytics unless the client explicitly asks after being told the implications.
- Contact form: explicit consent checkbox, purpose statement, and a retention policy. Default
  to deleting submissions after 12 months unless the client specifies otherwise — implement it
  as a configurable setting, not a hardcoded number.
- Any photo of an identifiable person needs documented consent. Build an internal-only
  "consent on file" boolean on `Media` so the team can track it.
- `Impressum` and `Datenschutzerklärung` are legally required in Austria. Ship the pages with
  placeholder markers and a visible build-time warning if they are still empty.
- No embedded YouTube/Maps/Fonts that phone home before consent. Use click-to-load wrappers.

---

## 10. Definition of done for Phase 1

- [ ] All pages in §3.1 exist and render in all three locales.
- [ ] Language switch preserves the current page where a translation exists.
- [ ] Arabic renders correctly RTL with no mirrored icons that shouldn't mirror and no LTR
      layout leaks. Test with real Arabic content, not lorem ipsum.
- [ ] An editor can create a news item, submit for review, and a board user can publish it —
      end to end, without touching code.
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on mobile, for Home and one
      article page, in German and in Arabic.
- [ ] Keyboard navigation works throughout; visible focus states; skip-to-content link.
- [ ] Tested with a screen reader on at least the Home and Contact pages.
- [ ] No console errors. No hydration warnings.
- [ ] Seed script populates realistic German content so the client sees a real site, not empty
      shells.
- [ ] `README.md` documents local setup, env vars, deployment, and backup/restore of the DB and
      media.
- [ ] A short **admin handbook in German** (2–3 pages) so the SVÖ team can run the site.

---

## 11. Working Agreement — read this before doing anything

1. **Start with Phase 0: plan, don't code.** Produce a proposed repo structure, exact package
   versions you intend to use (verified against current docs), the content model as
   TypeScript/Payload config sketches, and the route map. Show it to me and wait for approval.
   Do not scaffold until I say go.
2. **Ask when the brief is silent.** This document is deliberately incomplete in places. If you
   need a decision that isn't here, ask one focused question rather than assuming. Batch
   questions where you can.
3. **Never invent content.** Placeholder copy must be obviously placeholder (`[DE] …`) and
   listed in a `CONTENT-NEEDED.md` file that grows as you build. Legal text is never generated.
4. **Work in vertical slices.** One complete feature end to end (schema → API → page → admin →
   tests) before starting the next. Order: foundation & i18n → Pages/Home → News → Events →
   Services → Contact → legal/SEO/a11y pass.
5. **Commit per slice** with conventional commits. Run typecheck, lint and build before every
   commit. Never commit a broken build.
6. **Flag cost and complexity.** If something I've asked for will meaningfully raise hosting
   cost, maintenance burden, or launch date, say so before building it — decision 5 was
   "professional and practical at the lowest possible cost."
7. **Accessibility and RTL are not a final polish step.** Check them per slice. Retrofitting
   either is far more expensive than doing it right the first time.
8. **Keep a running `DECISIONS.md`** — every non-obvious technical choice, one or two lines,
   with the reason. The client's board will eventually want to know why things are the way
   they are, and a future developer will too.
9. **Don't silently expand scope.** Everything in §3.2 stays out. If you find yourself building
   a roadmap engine because it "makes the services page better", stop.
