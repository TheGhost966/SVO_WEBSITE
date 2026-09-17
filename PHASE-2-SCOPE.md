# PHASE-2-SCOPE.md

Tracks every feature the client marked "yes" in
`SVO_Website_Requirements_Questionnaire_AR_final_comprehensive_v2.docx` that is **not** built in
this run, per `BRIEF-AMENDMENT-03.md` §3. Each one is security-sensitive, payment-related, or
stores personal data — none should be written without a human reviewing the diff first.

This file is the client conversation the questionnaire actually triggers: every row below needs
a board decision before it can move into a real build slice, not just developer time.

| Questionnaire ref | Feature | Depends on | Board decision still owed |
|---|---|---|---|
| §12.1–12.5 | User accounts: email+password, Google/Apple OAuth, 8 roles, email verification | Nothing (foundational) | Is a full 8-role accounts system actually needed, or does the existing 4-role admin-side model (`admin`/`board`/`editor`/`viewer`) cover it? Auth is the highest-consequence code in any build — needs its own reviewed slice, not a bolt-on. |
| §6.3 | Roadmap progress saving ("mark step complete", resume later) | §12.1–12.5 (accounts) | None yet — blocked purely on accounts existing first. |
| §9.1–9.5 | Event registration, paid events, Stripe/PayPal/EPS/Klarna, QR check-in, attendee data | Nothing (foundational), but touches PII + payments | Which payment provider? Needs its own DSGVO review (attendee data is sensitive) and a decision on who reconciles payments. |
| §13.1–13.4 | Digital membership card + QR code | §12.1–12.5 (accounts), confirmed bank account (§13.4) | Bank account not yet chosen. Membership fee structure? |
| §13.3 | Donation button | Confirmed bank/payment details | Same payment-provider decision as event registration — consider deciding once, for both. |
| §8.2 | In-site job applications with CV upload | Nothing (foundational), but stores sensitive PII | Is CV storage even wanted, given the retention/access-control burden? Cheaper alternative: applicants email a CV directly to the company, and the site just carries the listing (already possible via `applyUrl`-style external links once the real `Jobs` collection is built — see `DECISIONS.md` "Jobs slice"). |
| §11.1–11.2 | Volunteering module: sign-up, hours tracking, certificates | §12.1–12.5 (accounts) | Who is authorised to issue a volunteer certificate on the association's behalf? That's a legal/authority question, not a schema question. |
| §6.4 | "شو وضعي؟" (What's my situation?) quiz routing into Roadmaps | Real Roadmap content (10 roadmaps per §6.1) | None — this one is content-blocked, not decision-blocked. Cheap to build once `CONTENT-NEEDED.md`'s Roadmaps gap is filled; revisit then. |
| §14.1, §14.3 | Push notifications, state-targeted (Bundesland) notifications | The planned mobile app + a push notification service | Which push provider (Firebase, OneSignal, etc.)? Depends on the app existing at all — explicitly out of scope for this website repo per `SVOE_PROJECT_BRIEF.md` §1. |

## What "parked" means in practice

- No schema fields, routes, or UI for any row above exist in this codebase, and none should be
  added incidentally while building something else ("this makes the services page better" is
  exactly the trap `SVOE_PROJECT_BRIEF.md` Working Agreement #9 warns against).
- Several rows share a dependency (accounts, or a payment-provider choice) — deciding that
  dependency once unblocks multiple rows at once. Worth raising as a single board conversation
  rather than one at a time.
- When the board is ready to move a row into scope, treat it as its own slice with its own
  fresh planning session, the same way `BRIEF-AMENDMENT-01.md` §7's session-prompt pattern
  handled Guide/Roadmaps/Experts/Jobs — not an addition bolted onto whatever slice is in
  progress at the time.
