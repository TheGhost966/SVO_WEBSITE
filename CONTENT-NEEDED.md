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

- [ ] SVÖ logo file (SVG preferred, PNG fallback) — for `SiteSettings.logo`
- [ ] Official address and office details — for `SiteSettings.contactGroup`
- [ ] Opening hours — for `SiteSettings.contactGroup.openingHours`
- [ ] Official email for public contact — for `SiteSettings.contactGroup.email`
- [ ] Social media links (Facebook, Instagram, YouTube, etc.)
- [ ] Board member photos and bios (all three locales)
- [ ] Partner/sponsor logos with permission to publish

## Home page

- [ ] Hero headline + subline + CTA text (DE/AR/EN)
- [ ] Hero image (1920×1080px minimum, licence cleared, consent on file if people visible)
- [ ] "What SVÖ does" section copy
- [ ] Three focus area descriptions for homepage cards

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

- [ ] Real guide topics beyond the "Arbeit" test topic — at minimum: Wohnen, Gesundheit, Behördenwege (per BRIEF-AMENDMENT-01 §2.6 scope)
- [ ] Real articles per topic, each with: `officialSourceUrl` pointing at the actual authoritative source (oesterreich.gv.at, migration.gv.at, ams.at, etc.), an accurate `lastReviewedAt`, and an appropriate `reviewIntervalMonths`
- [ ] AR/EN translations of topic titles/descriptions and article content — currently German-only test content falls back correctly on `/ar` and `/en` index pages, but **detail pages 404 for any topic/article whose slug isn't also filled in for that locale** (see DECISIONS.md "Known issues" — untranslated localized slugs 404 on non-default locales). Until AR/EN slugs are filled in, Arabic/English users can only reach the Guide index pages, not individual articles.
- [ ] A board process for who reviews articles past their `reviewIntervalMonths` (the admin list can be sorted by `lastReviewedAt`, but nothing currently proactively surfaces overdue reviews — same gap noted for Jobs review in BRIEF-AMENDMENT-01 §4)

## Roadmaps (Anleitungen)

- [ ] Real roadmaps beyond the "Meldezettel" test record — per BRIEF-AMENDMENT-01 §2.6 scope, at minimum: Anerkennung ausländischer Abschlüsse, Aufenthaltstitel-Verlängerung, ÖGK-Anmeldung
- [ ] Each roadmap's steps filled in with real `responsibleAuthority`, `timing`, `requiredDocuments`, and — where relevant — a `linkedGuideArticle`
- [ ] AR/EN translations — same caveat as Guide: detail pages 404 for locales without a translated slug (see DECISIONS.md "Known issues")
- [ ] A board process for who reviews Roadmaps and Guide articles past their `reviewIntervalMonths` — same open question noted under Guide above; one answer should cover both collections since they share the same freshness fields

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
