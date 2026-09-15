# BRIEF AMENDMENT 02 — Homepage

> **Status:** governs the homepage redesign against the Figma concept (*SVÖ Website – AR-EN
> Concept*, frame 6:2). Extends, and does not replace, `BRIEF-AMENDMENT-01.md`. Where this file
> and the original plan for the homepage conflict, this file wins. `SVOE_PROJECT_BRIEF.md` §11
> (Working Agreement) remains in force throughout.
>
> **How to use:** save as `BRIEF-AMENDMENT-02.md` in the repo root. The session prompt in §7 is
> what you paste into Claude Code.

---

## 1. Context and scope

The homepage currently renders the hardcoded fallback path (`FallbackHero` + `PillarsSection` +
news/events + `DefaultCTABand`), because the `pages` collection has no `home` record. The Figma
concept has roughly eleven sections. This amendment covers rebuilding that page.

**Ratified from the planning session:**

- The homepage's teaser sections are **bespoke React components**, not new generic Payload
  blocks. Query-driven sections don't fit the "editor fills in a CMS block" model.
- The hero is the **generic version only** — no personalised roadmap card, no ticket-flow card.
  The site is stateless and account-less.
- The Jobs section reflects the **curated-external-links reality** already shipped
  (`SiteSettings.jobResourceLinks`, per `DECISIONS.md` "Jobs slice"). Style it like Figma's job
  cards; do not fabricate company/date/type data.
- The **"Ressourcen" dropdown stays**. Figma's four flat nav items only work because Arabic
  labels are short. Do not flatten to match the design.

**Overridden from the planning session:**

- "Pixel-perfect where content is real" — see §2.6.
- "Keep out-of-scope features visible, clicking shows coming-soon" — see §2.4. This is accepted
  in principle and heavily restricted in practice.

---

## 2. Hard requirements

### 2.1 Homepage copy lives in the CMS, not in message files

Brief §4.3: *everything the client can plausibly want to change must be in the CMS, not in the
codebase.* §3.1: *all page copy editable without a developer.* Putting hero and CTA copy in
`src/messages/{de,ar,en}.json` fails both — the board cannot edit message files.

The split is **data vs. copy**, not bespoke vs. blocks:

| Comes from a query (stays in code) | Comes from the CMS (§3.1 fields) |
|---|---|
| teaser card contents, counts, job links | hero headline, subline, CTA label + href |
| card layouts, icons, section structure | stat tile labels, CTA band heading + body |
| UI chrome ("see all", filter labels) | help-card titles and descriptions |

`src/messages/*.json` keeps only true UI chrome. Anything a board member might reword goes in
`SiteSettings.homeGroup`.

If `SiteSettings.homeGroup` is empty, the section falls back to a sensible default in code —
never to a blank band.

### 2.2 Precondition: fix the deployment path before adding homepage surface

`npm run db:migrate` is broken (`DECISIONS.md` → Known issues). Dev-mode schema push is not a
deployment strategy, so **there is currently no way to deploy this application to production.**
§2.1 and §3.1 add `SiteSettings` fields, which makes that worse.

Fix it first, as its own slice. `DECISIONS.md` already names the approach: run the operation from
inside the working Next.js runtime (a temporary authenticated API route, or a script loading
`payload.config.ts` through Next's SWC pipeline) rather than as a standalone `tsx` script.

Done means: a schema change made locally can be captured as a migration, committed, and applied
to a fresh database that has never seen dev-mode push. Verify against a throwaway database, not
the working one.

### 2.3 Locale-safe links — no teaser may point at a 404

`DECISIONS.md` → Known issues documents that untranslated localized slugs 404 on non-default
locales, site-wide (`getPillarBySlug`, `getServiceBySlug`, `getGuideTopicBySlug`,
`getGuideArticleBySlug`). `CONTENT-NEEDED.md` confirms only German slugs are filled in.

Today that bug is buried behind an index page. Homepage teasers promote it to the first thing an
Arabic visitor sees — and Arabic is a large share of this audience.

**Preferred fix — do this one:** make `slug` unlocalized on `GuideTopics`, `GuideArticles`,
`Roadmaps` and `Services`, exactly as the Experts slice already does (`DECISIONS.md` → Experts
slice §2.3). A URL segment doesn't need to change per language; only `title`/`body` do. This is a
proven pattern in this codebase, it retires a site-wide bug rather than masking it on one page,
and it removes a standing content burden from the board.

**Fallback, only if §2.2's migration work makes the above unsafe to sequence now:** filter every
teaser to items resolvable in the current locale, and record in `DECISIONS.md` that the real fix
is deferred with a named follow-up.

Either way: no teaser card ships that can link to a 404. Verify by loading `/ar` and `/en` and
clicking every card.

### 2.4 "Coming soon" is capped — most of these get deleted, not deferred

The planning draft wires roughly eighteen coming-soon triggers onto one page. For an audience
reading at A2/B1 German and navigating an unfamiliar bureaucracy (brief §8), a dead end does not
read as "coming soon" — it reads as "I did something wrong." That is the failure mode this site
exists to prevent.

Dispositions, binding:

| Figma element | Disposition |
|---|---|
| Header login | **Delete.** No accounts exist by locked decision. A login control on an account-less site implies the user's failure to sign in is their own. |
| Header "Join us" | **Real link** to `/kontakt` with the membership category preselected (§3.2). |
| Header search | **Delete** unless real search ships (§2.4.1). |
| Hero search input | **Delete or build.** Never an input that swallows typed text — see §2.4.1. |
| Hero quick-filter chips | **Real links** to Guide topics. They already are Guide topics. |
| Help card 4 ("don't know where to start" quiz) | **Real link** to the Guide index, or omit the card and use a 3-card grid. |
| Roadmaps quiz CTA band | **Omit.** |
| "I have an idea" | **Real link** to `/kontakt`, idea category preselected (§3.2). |
| "Volunteer" | **Real link** to `/kontakt`, volunteering category preselected (§3.2). |
| App Store / Google Play badges | **Delete.** Out of scope, and the store badge licences do not cover use without a listed app — a badge that reaches no store is misleading. If the band survives, it is one line of text with no badges and no buttons. |
| Footer: volunteer, idea, community voice, digital membership, annual reports, official bodies | **Delete from the footer.** Dead links in a footer are an SEO and accessibility cost with no upside. Volunteer and idea may appear as the real contact links above instead. |

Routing intent to the existing contact form is the move to reach for anywhere else this comes up.
The form exists, has a category dropdown, and forwards to the board — it turns a fake feature into
a real one at no scope cost.

**If, after the above, nothing is left behind a modal, do not build `ComingSoonButton` at all.**
That is the expected outcome.

#### 2.4.1 The hero search input

Ship one of two things, never a third:

- **Build it.** A `like` query across `GuideArticles`, `Roadmaps` and `Services` titles/excerpts
  in the request locale, rendering to a `/suche` (de) / `/search` (ar, en) results page. Scope
  it small — no ranking, no facets, no highlighting.
- **Drop the input** and let the four chips carry the hero interaction as real Guide-topic links.

A visible text input that accepts typing and then produces a "coming soon" dialog is the single
worst outcome available on this page. Do not ship it.

### 2.5 Stats bar — suppress rather than embarrass

Refusing to fabricate Figma's "+1,200 registered members" is correct. But the database currently
holds test records (`CONTENT-NEEDED.md`): one expert, one guide topic, one roadmap. Computed
counts would render *"1 Expert:in · 2 Anleitungen · 0 Veranstaltungen · 9 Bundesländer"*, which
is worse than a fabricated number because it is honestly bad.

- A numeric stat tile renders only when its count is **≥ 3**; otherwise that tile is omitted.
- If fewer than three tiles survive, **the whole stats band does not render.**
- Non-count trust signals are always safe and preferred for launch: 9 Bundesländer, 3 Sprachen,
  the four Schwerpunkte, the founding year.

### 2.6 Figma is a reference, not a pixel spec

Brief §8 is explicit: use Figma for tone and layout, *not* as a pixel spec, because it was built
Arabic-first and this build is German-first. The "Ressourcen" dropdown deviation is that rule
asserting itself; it will not be the last instance.

The standard is: **structure and hierarchy match Figma; spacing, type and colour come from the
existing tokens in `src/app/globals.css`; German is the layout stress test, not Arabic.** German
strings run roughly 30% longer — check the hero headline, stat labels, card titles and button
labels at the longest German string before calling a section done.

Every deliberate deviation gets a line in `DECISIONS.md`, as the nav dropdown did.

### 2.7 Query discipline

The homepage is the most-hit page on the site.

- Wrap the section queries in `Promise.all` — they are independent.
- Never fetch a full collection to read a count. Use a count query (`limit: 0`) or
  `totalDocs` from a minimal find. `getUpcomingEvents(locale, 100)` to display a number is not
  acceptable.
- Never fetch a full collection to slice client-side for a teaser. Add a `limit` parameter to the
  query function instead.
- The page is ISR against the existing revalidate tags, not dynamic. Confirm a publish in the
  admin surfaces on the homepage within the expected window.

### 2.8 Copy provenance

Working Agreement #3: *never invent content; placeholder copy must be obviously placeholder.*
Agent-authored marketing copy in three languages, shipped as if final and flagged for "eventual"
board review, is exactly what that rule exists to prevent.

- Homepage copy authored in-session is placeholder until the board signs it off.
- `CONTENT-NEEDED.md` records board copy-review of the homepage as a **launch blocker**, not a
  nice-to-have — same weight as the legal pages.
- With §2.1 in place this costs the board nothing but an admin login, which is the point.

### 2.9 Dialog accessibility — only if something survives §2.4

If any coming-soon control remains, its dialog needs all of:

- focus trapped inside the dialog while open, focus returned to the trigger on close
- `aria-haspopup="dialog"` and `aria-expanded` on the trigger
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the dialog's own title
- a **visible close button** — Escape and click-outside are not discoverable and fail touch users
- `<button type="button">`, never an `<a>`, so it can never navigate anywhere fake

### 2.10 Design references do not live under `src/`

The eleven Figma PNG exports belong in `design/` (or `docs/design/`), not `src/images/` — nothing
under `src/` should be a non-shipping asset. Consider whether high-res exports need to be
committed at all.

---

## 3. Schema and small additions

### 3.1 `SiteSettings.homeGroup`

Localized fields, following the existing `contactGroup` / `jobResourceLinks` pattern. All optional
with in-code fallbacks:

| Field | Type |
|---|---|
| `heroHeadline`, `heroSubline` | localized text / textarea |
| `heroCtaLabel`, `heroCtaHref` | localized text / text |
| `statLabels` (array: `label`, `source`) | `source` is a select over the supported computed counts |
| `helpCards` (array: `title`, `description`, `href`) | max 4 |
| `ctaBandHeading`, `ctaBandBody`, `ctaBandCtaLabel`, `ctaBandCtaHref` | localized |

`SiteSettings` already has the `afterChange` hook busting `tags.siteSettings()` (added in the Jobs
slice), so edits surface immediately — confirm this still holds after the field additions.

### 3.2 Contact form category deep-link

`ContactForm.tsx` already has a category dropdown. Add:

- read a `?kategorie=` (de) / `?category=` (ar, en) query parameter and preselect the matching
  option
- the value is matched against the known category list and ignored if it doesn't match — never
  injected into the form as free text
- add the categories the §2.4 links need if they aren't already present: volunteering, idea /
  suggestion, membership enquiry (DE/AR/EN)

### 3.3 What is explicitly *not* added

No new Payload block schemas. No changes to `CardGrid.ts` or `CTABand.ts`. The homepage's bespoke
sections do not route through `BlockRenderer`.

---

## 4. Build order

0. **Migration path** (§2.2) — precondition, its own slice, its own commit. Nothing below ships
   to production without it.
1. **Unlocalized slugs** (§2.3) — retires the site-wide 404 bug and unblocks teasers.
2. **`SiteSettings.homeGroup` + contact deep-link** (§3.1, §3.2) — schema first, so the sections
   have something to read.
3. **Homepage sections** — hero, stats, help cards, teasers, CTA bands. One commit per section
   group is fine; one commit for all eleven is not.
4. **Header and footer** — after the homepage, since §2.4 determines what survives in both.

Slices 1 and 2 both touch the schema. Sequence them back-to-back and restart `next dev` between
heavy schema iterations (`DECISIONS.md` → dev-server note).

---

## 5. Definition of done

Extends `BRIEF-AMENDMENT-01.md` §5. In addition to that checklist:

- [ ] every interactive element on `/de`, `/ar`, `/en` either navigates somewhere real or is gone
      — walk the page and click all of them
- [ ] no teaser card links to a 404 on `/ar` or `/en` (§2.3)
- [ ] hero, stat labels, card titles and buttons checked at the **longest German string** (§2.6)
- [ ] homepage copy is editable from the admin panel without a code change (§2.1) — prove it by
      changing the hero headline in the admin and seeing it live
- [ ] stats band suppression verified with the current thin test data (§2.5)
- [ ] `Promise.all` in place; no full-collection fetch used for a count or a teaser (§2.7)
- [ ] keyboard pass over the whole page: tab order sane, focus visible, dropdown and any dialog
      operable without a mouse
- [ ] `DECISIONS.md` records every deliberate Figma deviation and the §2.4 dispositions
- [ ] `CONTENT-NEEDED.md` lists homepage copy review as a launch blocker (§2.8)

---

## 6. Launch gate

`BRIEF-AMENDMENT-01.md` §6 still stands: the bottleneck is content, not code. The homepage makes
that more visible, not less — it is the page that most obviously exposes thin collections.

A homepage with three well-populated teasers and no stats band beats one with eight sections and a
count of one. Ship the sections that have content behind them; leave the rest out until they do.

---

## 7. Session prompt — paste this into Claude Code

Start a **fresh session per slice** in §4. Do not run all five in one context.

```
Read SVOE_PROJECT_BRIEF.md, BRIEF-AMENDMENT-01.md and BRIEF-AMENDMENT-02.md in full
before doing anything. Also read DECISIONS.md — particularly "Known issues" — since
several requirements in AMENDMENT-02 exist because of entries there.

We are building slice <N> from BRIEF-AMENDMENT-02 §4: <name>.

Before writing code:
1. Show me the file-level plan for this slice only: what changes, what it reads from,
   what it deletes. Then stop and wait for my approval.
2. List every hard requirement in AMENDMENT-02 §2 that applies to this slice and say
   how you will satisfy each one. If one does not apply, say why in one line.
3. For any Figma element you intend to keep that has no working destination, quote
   its row from §2.4 and follow it. Do not invent a new disposition.
4. Ask focused questions in one batch. Do not assume.

After I approve:
- Build the slice end to end.
- Check RTL, long-German-string layout, and keyboard operation as you build.
- Run the §5 definition-of-done checklist and show me the results before committing.
- Commit with a conventional commit message. Never commit a broken build.
- Update DECISIONS.md and CONTENT-NEEDED.md in the same commit.

Do not start the next slice. Stop when this one is done.
```

### Between sessions

- Clear context. The next slice re-reads the markdown files, which is cheaper and more reliable
  than carrying a long history forward.
- If the agent proposes something that contradicts §2, point at the section number rather than
  re-arguing the reasoning.
- If a requirement here turns out to be wrong once you're in the code, change **this file** and
  say so in `DECISIONS.md`. Don't work around it in a session and leave the amendment stale.
