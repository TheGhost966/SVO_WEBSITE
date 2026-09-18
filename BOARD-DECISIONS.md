# BOARD-DECISIONS.md

Every open decision in `PHASE-2-SCOPE.md` and `DECISIONS.md` → "Blocked — needs Hamza", with a
recommended option rather than an open question.

Each entry: **Recommendation** · why · what happens if the board disagrees · what it unblocks.
These are recommendations from the development side, not decisions — the board decides. But a
board decides faster against a concrete proposal than against a question.

---

## 1. Public user accounts (§12.1–12.5)

**Recommendation: no public accounts at launch. Keep the existing four admin roles.**

The questionnaire asks for eight roles, email+password, Google and Apple sign-in, and email
verification. Consider what accounts are actually *for* here: they exist only to serve roadmap
progress saving, membership cards, and volunteer hours — none of which are launch-critical, and
all of which are separately deferred below.

What an account system costs an association this size:

- every registered user is a DSGVO data subject — right to access, right to erasure, data export,
  and a 72-hour breach notification duty
- password storage, reset flows, and session security become the association's responsibility
- Google and Apple sign-in each add a data processor to the Datenschutzerklärung; Apple's
  requirements are the more onerous of the two
- 3–5 volunteer admins (§12.4) now operate a user-management system

Auth is the highest-consequence code in any build. It deserves its own reviewed slice, not a
bolt-on.

**If the board wants accounts anyway:** scope them to *members only* — a known set of dozens, not
every site visitor — and ship email+password first. Add OAuth later if members ask for it.

**Unblocks:** roadmap progress saving (§6.3), membership cards (§13.1), volunteer hours (§11.2).

---

## 2. Payment provider — decide once, for everything (§9.3, §13.3, §13.4)

**Recommendation: no payment integration at launch. Bank transfer with a published IBAN.**

Donations, event fees and future membership fees all need the same decision, so make it once.

For an association at this stage, bank transfer is not a fallback — it's the right answer:

- zero integration work, zero provider fees, zero PCI scope
- many donors to community associations *prefer* a transfer with a reference line, especially for
  larger amounts
- Austrian donors are used to it; EPS exists precisely because bank transfer is the local default
- it needs no code, so it cannot break

Prerequisite either way: §13.4 says the association's bank account isn't confirmed yet. Nothing
here moves until it is.

**When volume justifies card payments:** Stripe, single provider. It covers cards, **EPS** (the
Austrian bank-transfer standard your community will expect) and Klarna in one integration and one
reconciliation. Adding PayPal alongside means two dashboards, two payout schedules, two sets of
books — for a volunteer treasurer that is real recurring cost.

**Who reconciles:** must be a named person. The Vereinsgesetz already requires
Rechnungsprüfer:innen, so name the treasurer (Kassier:in) explicitly rather than leaving it to
whoever notices.

**Unblocks:** donation button, paid events, membership fees.

---

## 3. Event registration (§9.1–9.5)

**Recommendation: build a simple registration form. No payment, no QR check-in.**

Registration itself is worth having at launch — it's the questionnaire's §9.1 and it's cheap: a
form writing to a collection, plus a confirmation email. Fields per §9.5 (name, email, phone,
Bundesland, accompanying adults, children, notes).

Skip these:

- **Payment** — for occasionally-paid events (§9.2), a bank transfer with a per-event reference
  number, reconciled manually, is proportionate. Integrating a provider for a handful of paid
  events a year is not.
- **QR check-in** — a printed attendee list works at community-event scale. QR check-in solves a
  problem you do not have yet.

**DSGVO note:** attendee lists include children's counts and "special needs" free text (§9.5).
That is sensitive. Set a retention period (recommend: delete 3 months after the event) and say so
on the form, exactly as the contact form already does.

---

## 4. Digital membership card + QR (§13.1)

**Recommendation: defer. Decide what membership *means* first.**

§13.2 says there are no membership fees at launch and the fee structure is undecided. A digital
card would therefore be an ID for a membership with no defined benefits, no fee, and no
entitlement attached.

The question to answer before any code: **what does a member get that a non-member doesn't?**
Discounted events? Voting rights at the Generalversammlung? A newsletter? Until that has an
answer, the card has nothing to represent.

**Unblocked by:** decision 1 (accounts) and a membership policy.

---

## 5. CV upload on job listings (§8.2)

**Recommendation: no. The site carries listings and links out.**

Stored CVs are among the most sensitive data this site could hold. A typical CV in this community
contains a photo, home address, date of birth, nationality, education history — and often lets a
reader infer residence or asylum status. Holding that creates retention duties, access-control
requirements, deletion-request handling, and a breach exposure far out of proportion to the
benefit.

§8.2 already offers the alternative the client also ticked: an external link or email. The
listing carries the company's own application route. The association stays out of the middle.

**If the board insists:** the CV goes directly to the employer's email via the form and is never
stored on the server. That is a meaningfully different system and needs its own slice.

---

## 6. Volunteer hours and certificates (§11.1–11.2)

**Recommendation: certificates are issued and signed by the board, not generated by the website.**

A volunteer certificate is a statement the association is vouching for. If the site generates it
automatically from self-reported hours, the association is defending numbers it never checked —
and these certificates get used in job and residency applications, so accuracy matters.

Proportionate version:

- the volunteer coordinator keeps hours in a spreadsheet or in the CMS
- when a volunteer requests a certificate, a board member reviews the record and signs a PDF
- the website's role is a volunteer *sign-up* form, nothing more

**Decision the board owes regardless:** who is authorised to sign on the association's behalf?
Name the role (Obmann/Obfrau, or a delegated coordinator) in the minutes.

---

## 7. Notifications (§14.1–14.3)

**Recommendation: newsletter yes, via Brevo. Push notifications deferred with the app.**

Push requires the mobile app, which the brief puts out of scope for this repository. Newsletter
is the near-term channel and does most of the same work.

**Brevo over Mailchimp**, concretely: Brevo is EU-headquartered with EU data residency, which
makes the Datenschutzerklärung and the processor agreement materially simpler for an Austrian
association. Mailchimp is a US processor and brings a transfer-mechanism question you don't need.

Bundesland-targeted sending (§14.3) is a segmentation feature both platforms have — it needs a
Bundesland field at signup, nothing more.

**Decision the board owes:** who writes and sends the newsletter, and how often. An abandoned
newsletter is worse than none.

---

## 8. Arabic as default language (`DECISIONS.md` §2.3)

**Recommendation: keep German as the default URL locale, and add browser-language detection.**

The questionnaire contradicts itself — §2.1 ticks all three boxes for a single-answer question,
while the six-decisions summary says Arabic. But §2.1 also offered an option nobody ticked:
*"حسب لغة متصفح الزائر"* — follow the visitor's browser language. That is the better answer than
either binary:

- a visitor with Arabic browser settings lands on `/ar` automatically
- a visitor with German settings lands on `/de`
- search engines still index a German-first `.at` domain, which is what Austrian institutional
  search expects, and what partner organisations and funders will find
- it is a small routing change, not an architectural one — next-intl supports it directly

Switching the *default* to Arabic instead means changing every German URL segment, the fallback
locale, canonical and hreflang tags, and reversing the German-first content that already exists in
every collection. Large cost for an answer the client gave ambiguously.

**Board question in one line:** should first-time visitors land in their browser's language
(recommended), or should everyone land in Arabic regardless?

---

## 9. Expert profile visibility (§7.4 vs §7.6)

**Recommendation: follow §7.6. Contact goes through the association, not direct.**

The questionnaire contradicts itself: §7.4 says show email and website publicly, §7.6 says contact
happens via a request that the administration mediates.

Go with §7.6, and show publicly: name, photo, specialty, languages, Bundesland, and website.
Withhold: email and phone. Reasons:

- it protects experts from scraping and unsolicited contact, which is what makes them willing to
  be listed at all
- it protects the association from appearing to endorse unmediated professional advice — which
  matters given §7.5 makes professional proof mandatory
- it gives the association visibility into whether the network is actually being used

The technical toggles already exist and are defaulted off, so this needs no new code — only the
board's confirmation.

---

## 10. Who verifies an expert's credentials (`BRIEF-AMENDMENT-01` §2.7)

**Recommendation: a named two-person rule.**

One person checks the public register, a second approves publication. Record which register was
checked and on what date, in the expert's own record.

Registers to check against:

| Profession | Register |
|---|---|
| Lawyers | Rechtsanwaltskammer — public online list |
| Doctors | Österreichische Ärztekammer — Ärzteliste |
| Psychotherapists | BMSGPK Psychotherapeut:innenliste |
| Court-certified translators | Gerichtsdolmetscherliste (SDG-Liste) |
| Tax advisors | Kammer der Steuerberater:innen und Wirtschaftsprüfer:innen |

**Board question in one line:** which two people, by name?

---

## 11. Who reviews Guide and Roadmap content for staleness

**Recommendation: one volunteer owner per topic cluster, six-month interval, quarterly board sweep.**

The `lastReviewedAt` and `reviewIntervalMonths` fields already exist and the admin list can be
sorted by them. What's missing is a person.

Proportionate version: group the 14 topics into 3–4 clusters (work and education; housing and
documents; health and family; money and business). One volunteer owns each. Once a quarter, a
board member sorts the admin list by `lastReviewedAt` and chases the overdue ones.

This matters more than it sounds: an article about AMS deadlines or ÖGK registration that is
eighteen months stale can cost someone money or entitlement, and the association's name is on it.

---

## 12. Who approves job postings (§8.1)

**Recommendation: name one person, and set a 60-day default expiry.**

§8.1 answers the model — companies post, an admin approves. What's still missing is who.

The expiry default is the important half: with automatic archiving after 60 days, a stale board
self-corrects even in a month when nobody has time to review. Without it, a jobs page is 60% dead
links within four months, and that is the section visitors judge the site by.

Until a name exists, the curated-links page stays as built.

---

## 13. "شو وضعي؟" quiz (§6.4)

**No board decision needed.** Blocked on content, not on a decision — it routes into Roadmaps, and
those need writing first (§6.1 asks for ten). Revisit once the Roadmaps content gap in
`CONTENT-NEEDED.md` is filled.

---

## Summary — what the board actually needs to answer

Six questions. Everything else follows from them.

1. Is the association's bank account confirmed, and who is the treasurer who reconciles payments?
2. Should first-time visitors land in their browser's language, or in Arabic regardless?
3. Which two named people verify expert credentials?
4. Who owns each Guide topic cluster for six-monthly content review?
5. Who approves job postings?
6. What does membership *mean* — what does a member get that a non-member doesn't?

Questions 1 and 6 unblock the entire payments and membership branch. Questions 3, 4 and 5 are
naming exercises that cost the board one meeting and unblock three launch-relevant sections.
