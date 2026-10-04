# QA suite

Black-box security tests that run the real app against a **disposable, local** Postgres. Findings
and results: `../QA_FINDINGS_P0.md`.

```bash
npm install        # first time (downloads embedded Postgres binaries)
npm run test:p0    # S1, S2, S4, S5/S6
npm run test:s3    # S3 (PAYLOAD_SECRET) + S14 (first admin) — dev variants + a real production build/start
npm run test:all
```

How it works:
1. `harness/postgres.ts` starts embedded Postgres 17 on `127.0.0.1:54329` (data in `.tmp/pg`, deleted afterwards).
2. `harness/migrate.ts` boots the app once with `PAYLOAD_MIGRATE_ON_BOOT=1` to build a template database from `../migrations`, then checks every migration file was applied.
3. `harness/app.ts` runs `next dev` with **`NODE_ENV=test`** (Next then skips `.env.local`) and an explicit environment: local DB, throwaway secret, SMTP pointed at a closed local port. `harness/safety.ts` refuses any database that isn't local, on port 54329, and named `svo_qa_*`.
4. `harness/seed.ts` creates the QA users (admin/board/editor/viewer) and one document per review status over REST.

Ports used: 3100 (P0), 3101/3102 (S3 dev/prod), 2526 (SMTP sink), 54329 (Postgres). Don't run while another `next dev` is running in
this repo. Evidence (JSON, `role-matrix.md`, server logs) is written to `evidence/` on every run.

`REGRESSION Sx` tests assert the secure behaviour after remediation (`../SECURITY_REMEDIATION.md`);
they replaced the earlier `REPRODUCES Sx` characterization tests on the same requests. If one fails,
the finding has come back — fix the code, don't loosen the test.

The P0 server sends mail to a local SMTP sink (`harness/smtpSink.ts`, 127.0.0.1:2526) that records
recipients in `.tmp/mail.jsonl`; nothing is delivered. The S3 suite also runs a real production
`next build` into `.next/qa-prod` (deleted at teardown) — expect ~2 minutes.
