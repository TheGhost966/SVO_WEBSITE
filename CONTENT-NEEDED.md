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

## About page

- [ ] Mission statement (DE/AR/EN)
- [ ] History / timeline content
- [ ] Board member bios and roles (all locales)

## Contact page

- [ ] Category options for the contact form dropdown (DE/AR/EN)
- [ ] `CONTACT_FORWARD_EMAIL` env var confirmed

## SEO / meta

- [ ] Default OG image (1200×630px) — for social sharing fallback
- [ ] Per-page meta descriptions will be added as content is entered

---
*Last updated: auto-maintained — add entries as you build each slice.*
