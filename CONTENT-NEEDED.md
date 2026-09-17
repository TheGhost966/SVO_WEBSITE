# CONTENT-NEEDED.md

Tracks all placeholder content that must be replaced before launch.
All items are marked `[DE]`, `[AR]`, or `[EN]` to show which locale is missing.

## Legal pages (hard blocker for launch)

These pages contain legally required content in Austria. **Never generate or invent legal text.**

- [ ] `/de/impressum` — full Impressum text from SVÖ board/lawyer
- [ ] `/de/datenschutz` — full Datenschutzerklärung, including:
  - Data controller details
  - Contact form retention period (confirm: 12 months default)
  - Cookie/analytics policy
- [ ] `/de/barrierefreiheit` — Barrierefreiheitserklärung (WCAG 2.1 AA)
- [ ] `/ar/impressum`, `/en/impressum` — same legal text if translations are needed (Impressum stays German by law)
- [ ] Contact form SMTP details and `EMAIL_FROM` address confirmed by SVÖ

## Organisation content (from SVÖ board)

- [ ] SVÖ logo file — **raster only (PNG/JPG), confirmed by the client questionnaire §3.1; no
      vector/SVG version exists or is coming.** Request the highest-resolution PNG available so
      it holds up at the hero/header sizes; do not ask for an SVG re-export that won't arrive.
- [ ] Official address and office details — for `SiteSettings.contactGroup`
- [ ] Opening hours — for `SiteSettings.contactGroup.openingHours`
- [ ] Official email for public contact — for `SiteSettings.contactGroup.email`
- [ ] Social media links (Facebook, Instagram, YouTube, etc.)
- [ ] Board member photos and bios (all three locales)
- [ ] Partner/sponsor logos with permission to publish

## Home page (launch blocker — same weight as the legal pages, see DECISIONS.md "Homepage sections")

BRIEF-AMENDMENT-02 §2.8: homepage copy authored during Slice 3 (hero, stat labels, help-card
titles/descriptions, CTA-band heading/body — everything in `SiteSettings.homeGroup`, plus every
in-code fallback string used when a field is empty) is agent-authored placeholder in three
languages, not final. Board sign-off on this copy is a launch blocker, not a nice-to-have.

- [ ] Board review + sign-off of all `SiteSettings.homeGroup` homepage copy (DE/AR/EN) once Slice 3 ships
- [ ] Hero headline + subline + CTA text (DE/AR/EN)
- [ ] Hero image (1920×1080px minimum, licence cleared, consent on file if people visible)
- [ ] "What SVÖ does" section copy
- [ ] Three focus area descriptions for homepage cards
- [ ] SVÖ founding year — needed for the static stats-band trust signal (9 Bundesländer · 3
      Sprachen · 4 Schwerpunkte · founding year). Not invented; the tile is omitted from Slice 3
      until this is supplied.

## Service pillars (seeded with placeholders)

- [ ] Full descriptions for all 4 pillars (DE required, AR + EN in order of priority)
- [ ] Service entries under each pillar (title, summary, body, target audience)

## News

- [ ] At least 3 real news articles for launch (DE required, translations optional)
- [ ] Cover images for each article (licence + consent)

## Events

- [ ] At least 1 upcoming event for launch (DE required)
- [ ] Past events backfill (optional but improves first impression)

## Austria Guide (Österreich-Guide)

- [ ] **14 guide topics at launch, per the client questionnaire §5.5** (up from the Figma's 12) —
      see `BRIEF-AMENDMENT-03.md` §2.4. Two are entirely missing from this repo and are **blocked
      on a human creating the records** — this session cannot write to the Neon database (see
      `DECISIONS.md` "Blocked — needs Hamza"). Proposed German title + slug, ready to paste into
      the admin UI once someone can:
  - **القيادة والمواصلات** (driving and transport) → title `Führerschein & Verkehr`, slug
    `fuehrerschein-verkehr`
  - **الجهات الرسمية** (official bodies / authorities) → title `Behörden & Ämter`, slug `behoerden`
  - The other 12 topics' exact names are only in the Figma exports (`design/figma-homepage-exports/`),
    not as text anywhere in this repo — read them off the design files directly when creating
    the remaining records rather than guessing from memory.
- [ ] Real guide topics beyond the "Arbeit" test topic — at minimum: Wohnen, Gesundheit, Behördenwege (per BRIEF-AMENDMENT-01 §2.6 scope)
- [ ] Real articles per topic, each with: `officialSourceUrl` pointing at the actual authoritative source (oesterreich.gv.at, migration.gv.at, ams.at, etc.), an accurate `lastReviewedAt`, and an appropriate `reviewIntervalMonths`
- [ ] AR/EN translations of topic titles/descriptions and article content — currently German-only test content falls back correctly on `/ar` and `/en` index pages, but **detail pages 404 for any topic/article whose slug isn't also filled in for that locale** (see DECISIONS.md "Known issues" — untranslated localized slugs 404 on non-default locales). Until AR/EN slugs are filled in, Arabic/English users can only reach the Guide index pages, not individual articles.
- [ ] A board process for who reviews articles past their `reviewIntervalMonths` (the admin list can be sorted by `lastReviewedAt`, but nothing currently proactively surfaces overdue reviews — same gap noted for Jobs review in BRIEF-AMENDMENT-01 §4)

## Roadmaps (Anleitungen)

- [ ] **10 roadmaps at launch, per the client questionnaire §6.1** (`BRIEF-AMENDMENT-03.md` §1.2).
      The questionnaire names a target count, not the 10 procedures themselves — those names
      exist only in the source `.docx`, not as text in this repo. Read them from that document
      when scoping which 10 to write first; the three below (from `BRIEF-AMENDMENT-01.md` §2.6)
      are a reasonable starting subset, not a substitute for the full list.
- [ ] Real roadmaps beyond the "Meldezettel" test record — per BRIEF-AMENDMENT-01 §2.6 scope, at minimum: Anerkennung ausländischer Abschlüsse, Aufenthaltstitel-Verlängerung, ÖGK-Anmeldung
- [ ] Each roadmap's steps filled in with real `responsibleAuthority`, `timing`, `requiredDocuments`, and — where relevant — a `linkedGuideArticle`
- [ ] AR/EN translations — same caveat as Guide: detail pages 404 for locales without a translated slug (see DECISIONS.md "Known issues")
- [ ] A board process for who reviews Roadmaps and Guide articles past their `reviewIntervalMonths` — same open question noted under Guide above; one answer should cover both collections since they share the same freshness fields

## Experts network (Expert:innen)

- [ ] **Board decision needed before launch:** who is responsible for verifying that an applicant is
      actually registered with the relevant chamber/authority (Rechtsanwaltskammer, Ärztekammer,
      etc.) before setting `verificationStatus` to "Verified" and publishing their listing? Not a
      code question — see DECISIONS.md.
- [ ] Fields of expertise to seed as `Categories` with `type: expert` (e.g. Rechtsberatung, Medizin,
      Übersetzung, Psychotherapie) — the public application form only shows a category dropdown once
      at least one exists
- [ ] Real expert listings beyond the "Dr. Layla Hassan" test record, sourced through the public
      "Als Expert:in eintragen" form or entered directly by the board
- [ ] Confirm `CONTACT_FORWARD_EMAIL`/`BOARD_NOTIFICATION_EMAIL` (or `SiteSettings.boardNotificationEmails`)
      is set in production — this is what actually delivers the "new expert application" email;
      without it, applications only surface by checking the admin panel
- [ ] Datenschutzerklärung's real legal text needs to describe the Experts removal/delisting path
      (see DECISIONS.md) once written by the board/lawyer

## Jobs / Stellenangebote

- [ ] **Board decision:** who maintains a weekly review of job postings, if the SVÖ ever wants a real
      job board? Until someone is named, this stays a curated-links page — see DECISIONS.md.
- [ ] Curated links to add to `SiteSettings.jobResourceLinks` — at minimum AMS (ams.at), karriere.at;
      consider willhaben Jobs, migration.gv.at's work-permit info page
- [ ] AR/EN translations for the two placeholder links already in `SiteSettings.jobResourceLinks`
      (AMS, karriere.at) — `label`/`description` are localized fields but only DE is filled in, so
      `/ar/jobs` and `/en/jobs` currently show German text via Payload's locale fallback

## About page

- [ ] Mission statement (DE/AR/EN)
- [ ] History / timeline content
- [ ] Board member bios and roles (all locales)

## Contact page

- [x] Category options for the contact form dropdown (DE/AR/EN) — implemented in `ContactForm.tsx`
- [ ] `CONTACT_FORWARD_EMAIL` env var confirmed

## SEO / meta

- [ ] Default OG image (1200×630px) — for social sharing fallback
- [ ] Per-page meta descriptions will be added as content is entered

## Documentation

- [ ] `ADMIN-HANDBUCH.md` (and its published artifact version) has a placeholder
      `[Kontakt der Entwicklung eintragen]` in the "Bei Problemen" / troubleshooting section —
      fill in with the actual developer/agency contact before handing off to the board.

---
*Last updated: auto-maintained — add entries as you build each slice.*
