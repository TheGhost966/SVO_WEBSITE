# BRIEF AMENDMENT 03 — Client questionnaire rulings + autonomous run

> **Status:** responds to `SVO_Website_Requirements_Questionnaire_AR_final_comprehensive_v2.docx`
> (client-completed, Arabic). Extends `BRIEF-AMENDMENT-01.md` and `BRIEF-AMENDMENT-02.md`.
> Where this file and either earlier amendment conflict, **this file wins** — it carries the
> client's own answers, which outrank inference from the Figma.
>
> **How to use:** save as `BRIEF-AMENDMENT-03.md` in the repo root, commit, then paste §5.

---

## 1. What the questionnaire changed

The questionnaire is a scope reset, not a detail pass. Read these before touching code.

### 1.1 Homepage purpose changed — this is the big one

§1.2 asks for **one** answer and says it determines the homepage shape. The client chose
**"عرض نشاط الاتحاد وبناء صورة رسمية"** — showcase the association's work, build an official
institutional image. They did **not** choose "إرشاد الجالية وتقديم المعلومة" (guide the community).

§4.3 confirms it: the first thing a visitor should see is **the logo and the association's
mission**, plus **latest news and events**. Not a search box. Not "I don't know where to start."

`SVOE_PROJECT_BRIEF.md` §1's guiding principle still governs the *Guide and Roadmaps sections*.
It no longer governs the *homepage*. The homepage leads with identity and activity; the
wayfinding content sits below it.

**Ruling:** Slice 3's section order changes (§2.1), and the order becomes board-editable (§2.2).

### 1.2 Answered open questions

| Question | Client answer | Effect |
|---|---|---|
| Hero search box (§4.3) | Not selected | Confirms AMENDMENT-02 §2.4.1 — dropped, stays dropped |
| Legal disclaimer on Guide (§5.4) | Yes | Confirms AMENDMENT-01 §2.6 |
| Expert professional proof (§7.5) | **Mandatory** | Hardens AMENDMENT-01 §2.7 — see §2.5 |
| Guide topics at launch (§5.5) | 14 named | Two are missing from the current 12 — see §2.4 |
| Roadmaps at launch (§6.1) | 10 | Content target for `CONTENT-NEEDED.md` |
| Jobs maintainer (§8.1) | Companies post, admin approves | AMENDMENT-01 §4's open question now has an answer — see §2.6 |
| Domain (§16.1) | **syrischerverband.at**, owned | Record it — see §2.7 |
| Server location (§16.3) | Austria / EU | Confirms the brief's DSGVO constraint |
| Logo format (§3.1) | PNG/JPG only, no SVG | No vector logo is coming; plan for raster |
| Brand colours (§3.2) | No brand guide — use the logo's blue and green | Existing tokens stand |
| Admin team size (§12.4) | 3–5 people, intermediate skill (§15.2) | Keep the admin simple |
| Translation policy (§2.4) | Publish what exists, complete later | Confirms `fallback: true` |
| Ticketing (§10.1) | Start with a simple contact form | Confirms current build |

### 1.3 Conflicts parked, not built — see §3

Accounts, payments, event registration, membership cards, volunteer hour tracking, CV uploads,
push notifications, and roadmap progress saving are all marked yes in the questionnaire and all
remain **out of scope for this run**. §3 says why and what to do instead.

---

## 2. Rulings — act on these without asking

### 2.1 Homepage section order

Per §1.1, the default order becomes:

1. Hero — logo, association name, mission statement, primary CTA
2. Stats / trust band (AMENDMENT-02 §2.5 suppression rules unchanged)
3. **News** and **Events** — moved up, these are what §4.3 asks for
4. Help cards ("how can we help today")
5. Roadmaps teaser
6. Guide teaser
7. Experts teaser
8. Jobs teaser
9. CTA band

### 2.2 The order is board-editable

§15.1 explicitly lists *"ترتيب أقسام الصفحة الرئيسية"* (homepage section ordering) among the
things the board must be able to change without a developer.

Add `SiteSettings.homeGroup.sectionOrder` — an array of `{ section: select, enabled: checkbox }`
rows, drag-reorderable in the Payload admin. `page.tsx` renders sections by iterating that array,
falling back to the §2.1 default when it's empty.

This also defuses §1.1 permanently: if the board later decides guidance should lead, they change
it themselves rather than filing a ticket.

### 2.3 Arabic as default locale — do NOT change, log it

The six-decisions section says Arabic by default. §2.1 of the questionnaire checks **all three**
boxes for a single-answer question, so the document contradicts itself.

The built architecture is German-default throughout: `routing.ts` defaults, German URL segments,
`localization.fallback` → German, German-first content in every collection.

**Ruling:** keep `de` as default. Record in `DECISIONS.md` as an open board question with the
actual cost of switching (routing defaults, fallback locale, every German URL segment, SEO
canonical/hreflang, and the German-first content that already exists). Do not switch on an
ambiguous answer.

### 2.4 Guide topics — add the two missing

§5.5 names 14 topics. The Figma's 12 are missing: **القيادة والمواصلات** (driving and transport)
and **الجهات الرسمية** (official bodies / authorities). Add both as `GuideTopics` records with
German titles and slugs. Content itself goes in `CONTENT-NEEDED.md`, not invented.

### 2.5 Experts — proof is mandatory

§7.5 answers "نعم إلزامي". `DECISIONS.md` currently records verification as process, not a
technical gate. Harden it one notch without blocking the board:

- add a `beforeChange` **validation warning** (not a hard block) when `reviewStatus` moves to
  `published` while `verificationStatus` is unverified
- surface `verificationStatus` in the `Experts` admin list columns so it's visible at a glance

§7.4 (show email and website publicly) and §7.6 (contact only via an admin-mediated request)
contradict each other inside the questionnaire. Keep the existing `showEmail`/`showPhone`
toggles, default them **off**, and log the contradiction for the board.

### 2.6 Jobs — the maintainer question is answered

§8.1 says companies post and the admin approves. That is a named maintenance model, which is
what AMENDMENT-01 §4 required before building the real `Jobs` collection.

**Ruling for this run:** the curated-links page stays. Record in `DECISIONS.md` that the collection
is now unblocked in principle, and that building it means AMENDMENT-01 §2.4 (detail page,
`JobPosting` JSON-LD) and §2.5 (expiry enforcement) become load-bearing again. CV upload stays
parked (§3).

### 2.7 Domain

`syrischerverband.at`, owned by the association. Record in `README.md` and `DECISIONS.md`. Make
sure `NEXT_PUBLIC_SERVER_URL`, canonical URLs, `hreflang`, sitemap, and robots all read from env
rather than anything hardcoded, so production needs one variable and no code change.

---

## 3. Parked scope — document, do not build

Every item below is marked yes in the questionnaire and is **not** built in this run. Each one is
security-sensitive, payment-related, or stores personal data, and none should be written without
a human reviewing the diff.

| Questionnaire | Feature | Why parked |
|---|---|---|
| §12.1–12.5 | Accounts, email+password, Google/Apple OAuth, 8 roles, email verification | Auth is the highest-consequence code in any build. Unreviewed auth on a site serving a vulnerable community is not acceptable. |
| §6.3 | Roadmap progress saving | Requires accounts |
| §9.1–9.5 | Event registration, paid events, Stripe/PayPal/EPS/Klarna, QR check-in, attendee data | Payments plus attendee PII. Needs its own scope, its own DSGVO review, and a payment provider decision by the board. |
| §13.1–13.4 | Digital membership card + QR | Requires accounts; bank account not yet chosen (§13.4) |
| §13.3 | Donation button | Needs the association's confirmed bank/payment details first |
| §8.2 | In-site job applications with CV upload | Stores CVs — sensitive personal data, retention policy, storage, access control |
| §11.1–11.2 | Volunteering module, hours tracking, certificates | Requires accounts; certificates imply an authority claim |
| §6.4 | "شو وضعي؟" quiz | Cheap to build, but it routes into roadmaps that don't exist yet — content-blocked, not code-blocked |
| §14.1, §14.3 | Push notifications, state-targeted notifications | Requires the app and a notification service |

**Action:** create `PHASE-2-SCOPE.md` listing each of these with the questionnaire reference, what
it depends on, and the decision the board still owes (payment provider, bank account, who issues
volunteer certificates, whether CVs are stored at all). That file is the client conversation this
questionnaire actually triggers.

---

## 4. Figma fidelity for this run

The client's instruction for this run is to match the Figma screenshots in the design exports
folder closely. That supersedes AMENDMENT-02 §2.6's "reference not spec" framing, with one
guard that is not optional:

**German is still the layout stress test.** Match the Figma's structure, spacing, colour and
component design as closely as the tokens allow. Where a German string overflows or wraps badly
at the Figma's dimensions, adapt the layout and **log each instance in `DECISIONS.md`** with the
string and what changed. Do not ship a section that breaks on `/de` in order to match a
screenshot built in Arabic.

The "Ressourcen" dropdown decision stands — do not flatten the nav.

The AMENDMENT-02 §2.4 dispositions stand: no login button, no join-us dead end, no app-store
badges, no dead footer links. Those features are parked in §3, and a control that leads nowhere
is worse than its absence. "Volunteer" and "I have an idea" route to the contact form with the
category preselected, as already specified.

---

## 5. Autonomous run prompt

```
Read, in this order, before doing anything:
  SVOE_PROJECT_BRIEF.md
  BRIEF-AMENDMENT-01.md
  BRIEF-AMENDMENT-02.md
  BRIEF-AMENDMENT-03.md   ← new, client questionnaire rulings, wins on conflict
  DECISIONS.md            ← especially "Known issues"
  CONTENT-NEEDED.md

Work autonomously. Do not stop to ask me to choose between options — every
decision you would ask about is already ruled on in AMENDMENT-03 §2, and where
it isn't, pick the option that is cheapest to reverse, do it, and log the call
in DECISIONS.md under "Assumptions made during the autonomous run". Keep going
until the work below is done or you run out of context.

PREFLIGHT — do this first, and let the result shape the run:
  Run the migration status check against the connection string actually in
  .env.local. Paste the output. If all three migrations are applied, proceed
  normally. If any are pending:
    - say so explicitly at the top of your first report
    - add a dev-only boot warning that logs loudly when SiteSettings.homeGroup
      is absent from the schema, so a fallback-only render can never again look
      like a working CMS path
    - continue building, but mark every definition-of-done item that depends on
      live data as UNVERIFIED — never as passed
  Do not attempt to write to the Neon database. If a write is blocked, stop
  that action, log it, and move on to work that doesn't need it.

WORK, in order. Commit after each. Never commit a broken build.

1. AMENDMENT-03 bookkeeping
   - PHASE-2-SCOPE.md per §3
   - DECISIONS.md: the Arabic-default open question (§2.3), the Jobs maintainer
     answer (§2.6), the §7.4/§7.6 contradiction (§2.5), the domain (§2.7)
   - CONTENT-NEEDED.md: 10 roadmaps, 14 guide topics, board copy sign-off,
     founding year, logo raster-only
   - README.md: domain syrischerverband.at

2. SiteSettings.homeGroup.sectionOrder (§2.2) — schema + admin ordering

3. Slice 3: homepage sections, in the §2.1 order, rendered from sectionOrder
   - Figma fidelity per §4, German overflow logged
   - AMENDMENT-02 §2.1 (CMS copy), §2.5 (stats suppression), §2.7 (Promise.all,
     count queries, no fetch-then-slice) all still binding
   - AMENDMENT-02 §2.4 dispositions all still binding

4. Header and footer per AMENDMENT-02 §2.4

5. The two missing guide topics (§2.4)

6. Experts verification warning + admin list column (§2.5)

7. Full pass: /de, /ar, /en — every link resolves, RTL clean, keyboard
   operable, long German strings checked

REPORTING
  After each numbered item, one short block: what shipped, what you assumed,
  what's unverified and why. No questions — I'm not available to answer them.
  If something is genuinely impossible without me, log it in DECISIONS.md under
  "Blocked — needs Hamza" and move to the next item.

DO NOT, under any circumstances:
  - build anything in AMENDMENT-03 §3 (auth, payments, registration, membership,
    CV upload, volunteer hours, push)
  - change the default locale
  - write to the Neon database
  - invent content: no founding year, no legal text, no association history,
    no statistics. Placeholder copy stays obviously placeholder per Working
    Agreement #3.
```
