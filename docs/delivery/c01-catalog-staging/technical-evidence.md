# C01 technical evidence

Date: 2026-09-21 (Asia/Ho_Chi_Minh). Revision 1, review round 1/2.
Integrated candidate: `7c73a13dabbc8bd63439b0705b249aa724551d88`.
All checks below ran after committing that candidate, with no code changes.
Later evidence/handoff commits affect documentation only.

Runtime: macOS ARM64, Node v26.0.0, OpenJDK 21.0.12, OrbStack Docker,
PostgreSQL `17-alpine`, repository-pinned Vite 8.2.1 / Vitest 4.1.10 /
Playwright 1.62.0. No test or security setting was disabled.

## Commands and actual results

From repository root:

```sh
npm run verify
```

Exit 0. Docs/fixtures valid; Contract Lock **20 resources / 12 API fixtures**;
generated OpenAPI client has no drift; all workspace TypeScript checks pass;
**155 frontend tests pass** (Admin 9, Store 118, API 2, rules 19, UI 7).
Admin and Store production builds pass. Admin bundle is 336.67 kB JS / 25.78
kB CSS. The Store large-chunk warning remains the existing baseline and was not
hidden or treated as measured device performance.

From `backend/`:

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test
```

Exit 0. **53 tests, zero failures/errors/skips** across 12 test classes.
PostgreSQL Testcontainers clean and V1→V8 upgrade migrations pass. New coverage
adds 3 parser tests and 3 catalog-import HTTP integration tests for valid UTF-8
and BOM, quoted comma, leading zero preservation, exact checksum replay, row
errors, malformed header, `CATALOG_ADMIN`/CSRF enforcement, next-request role
revocation, audit and absence of a published catalog version.

```sh
node e2e/scripts/verify-c01-catalog.cjs
ADMIN_UI_REVIEW_URL=http://127.0.0.1:4174 node e2e/scripts/review-admin-catalog.cjs
```

Both exit 0. The first command runs against a dedicated PostgreSQL database,
real Spring Boot backend and Admin production preview, with no API mocks and no
database changes during the browser flow. Actual output:

```text
PASS real API: UTF-8 multipart / identifiers preserved / validated detail
PASS real API: exact checksum replay returns immutable batch
PASS real API: duplicate barcode rejected / row messages / responsive UI
PASS real API: validated staging remains unavailable to store lookup
PASS desktop 1440×1000
PASS tablet 768×1024
PASS mobile 375×812
PASS mobile-large-text 375×812
PASS landscape 667×375
```

The viewport matrix is fixture-backed UI review and separately checks no page
overflow, minimum 44px control height, reduced-motion mode and browser errors.
The real-backend run independently verifies cookie login, CSRF multipart upload,
server persistence, reload-visible details and store lookup isolation. Read-only
SQL after the real flow reported `batches=2`, `rows=5`, `versions=0`, `audits=2`:
one immutable validated batch, one rejected batch, no published version and one
audit event per new batch. Exact-byte replay did not add a batch or audit event.

Screenshots (ignored local verification artifacts):

- `.local/verification/c01-real-backend/{catalog-desktop,catalog-mobile}.png`
- `.local/verification/c01-admin-catalog/{desktop,tablet,mobile,mobile-large-text,landscape}.png`

Desktop/mobile screenshots were visually inspected: existing green UI DNA is
retained; table/card variants, Vietnamese result copy, leading-zero identifiers,
error messages and navigation remain readable without clipping or overlap. The
UI/UX skill guided responsive table-to-card behavior, touch sizes, visible focus,
status text plus icon/color and reduced-motion checks.

```sh
git diff --check
bash -n e2e/scripts/start-c01-acceptance.sh e2e/scripts/stop-c01-acceptance.sh
node --check e2e/scripts/verify-c01-catalog.cjs
node --check e2e/scripts/review-admin-catalog.cjs
```

All exit 0. The owner preview was then reset from the synthetic seed. Final
checks show backend health `UP`, recorded revision `7c73a13...`, and `batches=0`.

## What this does not prove

- This is not owner acceptance; the user gate remains pending and C01 is not
  CLOSED.
- This is not remote CI, merged/main delivery, physical-device acceptance or a
  production deployment. No remote was fetched/pushed and no PR was created.
- C01 intentionally does not publish, select a primary supplier or modify Store
  PWA lookup data. Those decisions and implementation belong to C02.
- CSV is the only input format. Header order, 5 MiB and 50,000-row limits are
  fixed for this slice; list history is capped at 50 batches and detail pages at
  200 rows in the UI.
- The local preview uses synthetic users/data and loopback-only services. It is
  not suitable for operational catalog data.
