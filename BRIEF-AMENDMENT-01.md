# BRIEF AMENDMENT 01 — Phase 1 scope expansion

> **Status:** amends `PROJECT_BRIEF.md` §3.1 and §3.2. Where this file and the brief conflict,
> this file wins. Everything else in the brief — including the Working Agreement in §11 —
> remains in force.
>
> **How to use:** save as `BRIEF-AMENDMENT-01.md` in the repo root. The session prompt at the
> bottom of this file is what you paste into Claude Code.

---

## 1. Scope change

The client's reference Figma design is built around four systems that §3.2 defers to Phase 2+.
The client has decided to build all four in Phase 1. This is a deliberate, approved expansion —
Working Agreement #9 ("don't silently expand scope") is satisfied by this document.

**Moved into Phase 1:** Austria Guide (topics + articles) · Roadmaps · Experts Network ·
Jobs Board.

**Still out of scope, unchanged:** public user accounts · personal progress tracking on
roadmaps · the Figma's "3 of 6 steps" hero tracker · Volunteering module and hours tracking ·
"I have an idea" submission · the native app promo section · event registration · ticketing ·
surveys · membership cards · payments.

Note: `volunteer` as a *listing type* on the Jobs Board is in scope. The volunteering module is
not. These are different things; do not let one justify the other.

---

## 2. Hard requirements

These are not suggestions. A slice is not done until its applicable items pass.

### 2.1 Security — public write path for expert applications

The public "apply to be listed" flow must **not** open a public API write endpoint.

- **Do not** set `Experts.access.create` to `() => true`. Unlike `ContactSubmissions`, the
  `Experts` collection is publicly readable and holds published records — opening create exposes
  `POST /api/experts` and the GraphQL mutation to the internet.
- Keep `access.create` as `isEditorOrAbove`. The server action uses the Local API
  (`payload.create`), which bypasses access control; pass `overrideAccess: true` explicitly so
  the intent is visible in the code.
- The server action **whitelists fields explicitly**. Never spread the submitted payload into
  `payload.create`.
- `verified` and `reviewStatus` need field-level access on **`create` and `update`**, not
  `update` alone — `update` access does not gate the value on insert.
- No photo upload on the public form. That would open a second public write path and unbounded
  storage. The board attaches a photo after verification.
- Add a honeypot field and per-IP throttling to the form.

### 2.2 Applications must reach a human

Creating applications as `draft` means `notifyBoardOnReview` never fires and submissions sit
unseen. Create them as `in_review`, or add a separate `applicationStatus` field with its own
notification. An applicant who hears nothing for three months is a reputational cost.

### 2.3 Slugs, not IDs

`/[locale]/experten/[id]` breaks the repo's slug convention, leaks object IDs, loses SEO on the
highest-intent pages, and doesn't fit the `locale:'all'` hreflang lookup used everywhere else.
Add a `slug` field derived from the name with a collision suffix, same as every other collection.

### 2.4 Jobs needs a detail page

A list that links straight out to `applyUrl` forfeits the highest-intent traffic the site will
get. Build `/[locale]/stellenangebote/[slug]` using the News detail pattern, and emit
`JobPosting` JSON-LD with `validThrough` — Google for Jobs requires an indexable page.

### 2.5 Expiry must be enforced, not just stored

`expiryDate` on `Jobs` has to do something:

- public queries filter `expiryDate > now`
- a hook or scheduled task flips expired postings to `archived`
- expired postings 404 or redirect to the list, never render as live

### 2.6 Content freshness on Guide and Roadmaps

Procedural content about AMS, ÖGK, Meldezettel, Anerkennung and Aufenthaltstitel causes real
harm when stale. On both `GuideArticles` and `Roadmaps`:

- `lastReviewedAt` (date, required) — rendered on the page as `Stand: DD.MM.YYYY`
- `officialSourceUrl` — rendered as a link to oesterreich.gv.at / migration.gv.at / ams.at etc.
- `reviewIntervalMonths` (default 6) plus an admin list view the board can sort by overdue
- a standing "Dies ist keine Rechtsberatung" notice in the layout — not per-article rich text

### 2.7 Personal data of third parties (Experts)

- `consentOnFile` (checkbox) + `consentDate` — mirrors the `Media` consent pattern in brief §9
- `verificationStatus` + `verifiedAt` — someone must confirm the person is actually registered
  with the Rechtsanwaltskammer / Ärztekammer. Record who owns this in `DECISIONS.md`.
- No `Person` JSON-LD carrying contact details
- A documented removal path — an expert can ask to be delisted
- The public application form is subject to brief §9 the same as the contact form:
  explicit consent checkbox, purpose statement ("wofür wir Ihre Daten verwenden"),
  and a stated retention period. Link to the Datenschutzerklärung from the form.
- Retention: any `Experts` record that never reaches `published` is deleted after a
  configurable period (default 12 months), same mechanism as `ContactSubmissions`.
  Configurable setting, not a hardcoded number.
  
### 2.8 Empty states

`GuideTopics` has no `reviewStatus`, so all 12 topics are publicly reachable from day one.
Filter the topic grid to topics with at least one published article. Same principle for
roadmaps and job types with no live records.

### 2.9 Routes and navigation

- Decide the `ar` and `en` route segments **now**, in this amendment's slice, not later.
  Renaming a launched route costs redirects and lost indexing. Transliterated Latin segments
  are acceptable — just pick them and record the choice.
- Four new top-level nav items on top of the existing set will overflow the header in German.
  Group Guide + Roadmaps under one entry (e.g. *Wegweiser*) before wiring nav.

---

## 3. Schema additions beyond the original plan

### Roadmaps — steps array

The brief's guiding principle (§1) is that the site tells the user *what to do, who is
responsible, and where to go next*. A step of title + textarea + one link does not deliver that.
Each step needs:

| Field | Purpose |
|---|---|
| `responsibleAuthority` | AMS, ÖGK, MA 35, Finanzamt, Magistrat — the "who is responsible" half |
| `requiredDocuments` (array) | the most-asked question in this domain |
| `timing` / `deadline` (text) | e.g. "innerhalb von 3 Tagen" — often the part that costs money |
| `linkedGuideArticle` (rel) | link to the article, not the topic — a topic dumps the user on a list |
| `links` (array, not single) | steps routinely need two or three |

### Cross-links

Add relationship fields so the four systems aren't four silos:
`GuideArticles.relatedServices`, `.relatedExperts`, `.relatedRoadmaps`.
Cheap now, painful to retrofit.

---

## 4. Revised slice order

1. **Guide** (topics + articles) — validates the pattern, reuses Services' proven 3-level shape
2. **Roadmaps** — built adjacent to Guide so the cross-link schema is touched once, not twice
3. **Experts** — directory, filtering, and the public apply flow (the security-sensitive slice)
4. **Jobs** — last, and the one most likely to be cut if no maintainer is assigned

Before starting slice 4, answer in `DECISIONS.md`: **who reviews job postings weekly?** If the
answer is nobody, ship a curated links page to AMS / karriere.at instead of the collection.

---

## 5. Per-slice definition of done

Extends brief §10. All must pass before the commit:

- [ ] `npm run typecheck` and `npm run lint` clean
- [ ] `npm run build` exit 0 against the live DB
- [ ] one real record created through the admin UI, flowing to the public page
- [ ] `/ar/…` renders RTL correctly — real Arabic content, no LTR leaks, arrows via
      `forwardArrow(locale)`
- [ ] **accessibility checked in the same pass** (Working Agreement #7): keyboard operation of
      any new filter component, visible focus states, correct aria wiring, headings in order
- [ ] empty state renders correctly when the collection has no published records
- [ ] `makeRevalidateOnPublish` branch verified for collections without `reviewStatus`
- [ ] `DECISIONS.md` updated with any non-obvious choice
- [ ] `CONTENT-NEEDED.md` updated with what the client must supply

---

## 6. Launch gate — content, not code

The bottleneck is not the build. Twelve topics × ~4 articles × 3 locales is ~144 items, each
through the board approval workflow in §7. A volunteer board will not clear that before launch.

**Launch with 3–4 topics fully written in DE + AR and the rest hidden.** Three excellent guides
beat twelve empty ones, and empty sections are how NGO sites come to look abandoned.

---

## 7. Session prompt — paste this into Claude Code

Start a **fresh session per slice**. Do not run all four in one context.

```
Read PROJECT_BRIEF.md and BRIEF-AMENDMENT-01.md in full before doing anything.
The amendment overrides the brief on scope; §11 of the brief still governs how you work.

We are building slice <N>: <Guide | Roadmaps | Experts | Jobs>.

Before writing code:
1. Show me the collection config sketch, the route map, and the i18n/nav changes
   for this slice only. Then stop and wait for my approval.
2. List every hard requirement from BRIEF-AMENDMENT-01 §2 that applies to this
   slice, and say how you will satisfy each one. If one does not apply, say why.
3. Ask any focused questions in one batch. Do not assume.

Then, after I approve:
- Build one vertical slice end to end: schema → queries → types → routes/components
  → nav + i18n wiring.
- Check RTL and accessibility as you build, not at the end.
- Run the §5 definition-of-done checklist from the amendment and show me the results
  before committing.
- Commit with a conventional commit message. Never commit a broken build.
- Update DECISIONS.md and CONTENT-NEEDED.md in the same commit.

Do not start the next slice. Stop when this one is done.
```

### Between sessions

- Clear context; the next slice re-reads the two markdown files, which is cheaper and more
  reliable than carrying a long history forward.
- If something surprised you during the slice, add it to this amendment rather than to your own
  memory of the conversation. The repo is the source of truth for the next session.
- If the agent proposes something that contradicts §2, that is the amendment doing its job —
  point at the section number rather than re-arguing the reasoning.
