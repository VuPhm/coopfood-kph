# D01 technical evidence

Date: 2026-09-22 (Asia/Ho_Chi_Minh). Revision 1, round 1/2.
Integrated candidate: `9f099e134c0894707e3be302fd0df29f1123c040`.
All gates below ran after committing that candidate, with no code changes.
Later handoff/evidence commits affect this cycle directory only.

Runtime: macOS ARM64, Node v26.0.0, OpenJDK 21.0.12, OrbStack Docker,
PostgreSQL `17-alpine`, repository-pinned Vite 8.2.1 / Vitest 4.1.10 /
Playwright 1.62.0. No test or security setting was disabled.

## Commands and actual results

From repository root:

```sh
npm run verify
```

Exit 0. Docs/fixtures valid; Contract Lock **21 resources / 13 API fixtures**;
generated OpenAPI client has no drift; all workspace TypeScript checks pass;
**156 frontend tests pass** (Admin 9, Store 119, API 2, rules 19, UI 7).
Admin and Store production builds pass. The Store large-chunk warning remains
the existing baseline and was not hidden.

From `backend/`:

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q clean test
```

Exit 0 after rerunning outside the filesystem/network sandbox so Testcontainers
could access the OrbStack socket. **54 tests, zero failures/errors/skips** across
12 test classes. PostgreSQL 17.10 clean/upgrade checks pass through V8. The KPH
integration coverage includes page boundaries, seven server-side sort modes,
stable `createdAt DESC, id DESC` tie-breaking, filters, totals and authorization.

```sh
./e2e/scripts/stop-online-acceptance.sh --quiet
./e2e/scripts/start-online-acceptance.sh
npm --prefix e2e test
```

All exit 0. The runtime revision file is exactly the candidate SHA. Playwright
runs the real backend and production Store PWA preview with synthetic data:
**8 passed, 4 intentionally skipped, 34.3 seconds**. The history paging flow
passes in desktop and mobile projects; it verifies global server sorting,
page 1 → 2 → 1 navigation, stable totals and page-local selection clearing.
Other real-backend flows retain create/reload/private-media, cross-store
isolation, review/export and expired-session behavior.

The updated acceptance seed creates 30 TPTS records plus private evidence media.
A direct authenticated read of page 2 returned:

```text
page=2, pageSize=25, totalItems=30, totalPages=2, items=5
photo response: 222-byte valid JPEG
runtimeRevision=9f099e134c0894707e3be302fd0df29f1123c040
```

## Query-plan evidence and index decision

The before/after benchmark used PostgreSQL 17 with migrations V1–V8 and only
synthetic data: 20,000 KPH records and 40,000 photo rows. `EXPLAIN ANALYZE`
measured the old join-all history query at **216.528 ms**, including an external
merge spill of about **17,112 kB**. The D01 shape measured:

- filtered record count: **6.949 ms**;
- per-type totals: **7.530 ms**;
- page records plus photos after `LIMIT/OFFSET`: **1.483 ms**;
- sequential total: about **15.962 ms**.

This is approximately 13.6× lower elapsed time for the measured shape and keeps
photo fan-out outside the global sort. The existing indexes and bounded
`pageSize <= 100` are sufficient for this milestone, so D01 deliberately adds
no V9 migration. This is a local synthetic benchmark, not a production SLO.

## Implementation decisions verified

- The OpenAPI list response is a page object with 1-based page, page size,
  total items/pages and unfiltered type totals; filtering and all seven sorts
  happen before pagination.
- Backend authorization/store scope stays authoritative. Records are selected
  and paged before their ordered 1–3 photo rows are loaded.
- Online query identity includes user, store, type, date, approval, sort and
  page. Previous data is retained only when changing page within the same
  scope/filter, preventing stale cross-store display.
- Selection and select-all are page-local and reset on navigation/scope change;
  navigation exposes current state and loading/disabled feedback.
- Pilot local-only behavior is unchanged. The UI/UX review retained accepted UI
  DNA while improving paging semantics, touch targets and accessible labels.

## What this does not prove

- Not owner acceptance: the user gate remains pending and the cycle is not
  closed.
- Not remote CI, merge/main delivery, physical-device acceptance, production
  load testing or deployment. No remote was fetched/pushed and no PR was made.
- Offset pagination is intentional for D01; cursor pagination, infinite scroll,
  cross-page selection and export beyond the current contract remain out of
  scope.
- The benchmark and preview use synthetic local data only. They do not establish
  production capacity or latency guarantees.

