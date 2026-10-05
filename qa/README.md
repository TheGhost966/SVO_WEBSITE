# QA suite

Black-box security tests that run the real app against a **disposable, local** Postgres.

```bash
npm install        # first time (downloads embedded Postgres binaries)
npm run test:p0    # S1, S2, S4, S5/S6, S7/S8, N3, S13 (headers), S16/S17, S21 (users), C1 (?draft=true), A1 (single save), harness + query hygiene
npm run test:s3    # S3 (PAYLOAD_SECRET), S14 (first admin), production-build checks (incl. admin → public site propagation), data migrations — dev variants + a real production build/start
npm run test:all
```

How it works:
1. `harness/postgres.ts` starts embedded Postgres 17 on `127.0.0.1:54329` (data in `.tmp/pg`, deleted afterwards).
2. `harness/migrate.ts` boots the app once with `PAYLOAD_MIGRATE_ON_BOOT=1` to build a template database from `../migrations`, then checks every migration file was applied.
3. `harness/app.ts` runs `next dev` with **`NODE_ENV=test`** (Next then skips `.env.local`) and an explicit environment: local DB, throwaway secret, SMTP pointed at a closed local port. `harness/safety.ts` refuses any database that isn't local, on port 54329, and named `svo_qa_*`.
4. `harness/seed.ts` creates the QA users (admin/board/editor/viewer) and one document per review status over REST.

Ports used: 3100 (P0), 3101/3102 (S3 dev/prod), 2526 (SMTP sink), 54329 (Postgres). Don't run while another `next dev` is running in
this repo. Evidence (JSON, `role-matrix.md`, server logs) is written to `evidence/` on every run.

`REGRESSION Sx` tests assert the secure behaviour after remediation;
they replaced the earlier `REPRODUCES Sx` characterization tests on the same requests. If one fails,
the finding has come back — fix the code, don't loosen the test.

The P0 server sends mail to a local SMTP sink (`harness/smtpSink.ts`, 127.0.0.1:2526) that records
recipients in `.tmp/mail.jsonl`; nothing is delivered. The S3/S14 suite also runs a real production
`next build` into `.tmp/next-prod` — expect ~2 minutes.

**The harness never uses the app's `.next`.** Every server it boots gets its own `NEXT_DIST_DIR`
(`.tmp/next-<boot name>`, `harness/app.ts`), removed when that server stops and swept again at
setup and teardown. `harness/repoFiles.ts` puts `tsconfig.json` and `next-env.d.ts` back, including
the `include` entries Next adds for each of those directories.

## Manual QA stack (browser testing)

`stack.ts` runs the app as a **production build** (`next build` + `next start`) on the same
disposable Postgres, with the SMTP sink, the project's seed content (`npm run seed`) and one user
per role. Use it to click through `/admin` and the public site in a real browser — cache
revalidation only behaves realistically in a production build.

```bash
npm run stack -- up              # build + start on http://127.0.0.1:3100, keeps the previous database
npm run stack -- up --fresh      # empty database: migrate from scratch, seed, create the four users
npm run stack -- up --no-build   # reuse the previous build (only if no source file changed)
npm run stack -- down            # stop; also cleans up after a killed `up`
npm run stack -- status
```

- Users: `qa-admin@test.invalid`, `qa-board@…`, `qa-editor@…`, `qa-viewer@…`; the password is
  `PASSWORD` in `harness/seed.ts`. `.tmp/stack.json` lists them while the stack is up.
- Open it as `http://127.0.0.1:3100` (not `localhost`): the admin panel calls the API on the
  server URL it was built with, and the session cookie belongs to that host.
- Mail: `.tmp/mail.jsonl` (one JSON line per message). Server log: `evidence/logs/stack-app.log`.
- Its database lives in `.tmp/pg-stack` and survives a restart; `--fresh` deletes it. It uses the
  same Postgres port as the suites, so **stop the stack before `npm run test:*`** — the suites also
  sweep `.tmp/next-*`, which removes the stack's build.
- Files uploaded through the admin land in `../public/media` (gitignored). Remove them afterwards.
