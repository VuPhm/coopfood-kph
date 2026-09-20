# P03 technical evidence

Date: 2026-09-21 (Asia/Ho_Chi_Minh). Revision 1, round 2/2.
Integrated candidate: `b9e909daeb2aaa92ccd51dadc08d1162d0481e7c`.
All checks below ran after committing that candidate, with no code changes.
Later handoff/evidence commits affect this cycle directory only.

Runtime: macOS ARM64, Node v26.0.0, OpenJDK 21.0.12, OrbStack Docker,
PostgreSQL `17-alpine`, repository-pinned Vite 8.2.1 / Vitest 4.1.10 / Playwright.
OrbStack was initially stopped on resume; started it and reran failed
infrastructure attempts. No test/security setting was disabled.

## Commands and actual results

From repository root:

```sh
npm run verify
```

Exit 0. Docs/fixtures valid; Contract Lock **17 resources / 9 API fixtures**;
generated OpenAPI client no drift; all workspace TypeScript checks pass;
**152 frontend tests pass** (Admin 6, Store 118, API 2, rules 19, UI 7).
Admin/Store production builds pass. Admin bundle 320.29 kB JS / 23.66 kB CSS.
Store large-chunk warning remains the baseline; not hidden or treated as measured
device performance. Raw local output: `/tmp/p03-frontend-verify.log`.

From `backend/`:

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test
```

Exit 0. **47 tests, zero failures/errors/skips** across 10 test classes:
database 7, identity HTTP 1, identity security 7, identity service 4, catalog 5,
KPH HTTP 7, media 5, store policy 4, architecture 1, lifecycle HTTP 6.
PostgreSQL Testcontainers clean/upgrade migrations pass through V7. New lifecycle
tests cover +29 reject / +30 accept, trimmed reason, pending uniqueness,
reschedule/cancel audit, early execute denied, cross-region denial, revoke before
execute, missing-manager guard, active-store region guard, terminal-scope ordering,
target foreign keys, CSRF/unknown-field/blank-reason rejection and next-request
KPH denial. Surefire output: `backend/target/surefire-reports/`; raw local log
`/tmp/p03-backend-test.log` is not committed (may contain framework diagnostics).

```sh
DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock bash e2e/scripts/start-p03-acceptance.sh
node e2e/scripts/verify-p03-lifecycle.cjs
node e2e/scripts/review-admin-lifecycle.cjs
```

All exit 0. Fresh dedicated DB `coopfood_kph_p03_acceptance` and real backend,
Admin production build/preview. `verify-p03-lifecycle.cjs` uses **no API mocks**
and no direct DB changes during the flow. Historical due schedules come only
from the explicit synthetic seed. Actual output:

```text
PASS real API: create +30 / reschedule / reload persistence / cancel
PASS real API: active-store guard / store then region execute / next-request KPH denial
PASS real API: logout / regional scope / forged ID denied / mobile / expired-session data removed
PASS login-mobile 375×812
PASS desktop 1440×1000
PASS tablet 768×1024
PASS mobile 390×844
PASS landscape 667×375
```

The last five lines are **fixture-backed UI review**, not backend evidence.
It checks overflow, minimum 44px control height, login keyboard entry, console
errors and create/cancel feedback under reduced-motion preference.
Real-backend checks independently verify cookies/CSRF, reload persistence,
cross-user cache clearing, forged schedule ID denial and expired-session cleanup.
Read-only SQL inspection after E2E confirmed V7 success and exactly one each of
`STORE_DEACTIVATION_SCHEDULED`, `STORE_DEACTIVATION_RESCHEDULED`,
`STORE_DEACTIVATION_CANCELLED`, `STORE_DEACTIVATED`, `REGION_DEACTIVATED`.

Screenshots (ignored local verification artifacts):

- `.local/verification/p03-real-backend/chain-desktop.png`
- `.local/verification/p03-real-backend/regional-mobile.png`
- `.local/verification/p03-admin-lifecycle/{login-mobile,desktop,tablet,mobile,landscape}.png`

Desktop/mobile real-backend screenshots visually inspected: retained UI DNA,
readable Vietnamese labels, no clipping/overlap/horizontal overflow. UI/UX skill
guided touch size, reduced-motion support, clear confirmation and operation copy.

```sh
git diff --check
bash -n e2e/scripts/start-p03-acceptance.sh e2e/scripts/stop-p03-acceptance.sh
node --check e2e/scripts/verify-p03-lifecycle.cjs
```

All exit 0. Acceptance record check runs after the evidence-only commit:

```sh
node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo . --plan docs/delivery/p03-scheduled-lifecycle/plan.json --phase acceptance
```

## What this does not prove

- Not owner acceptance; user gate stays pending and cycle is not CLOSED.
- Not remote CI, merged/main delivery, physical-device acceptance or production
  hardening. No remote was fetched/pushed or PR created.
- Schedule execution is manual when due. Notifications/background scheduler,
  identity/credential provisioning and reactivation remain out of scope.
- Tests simulate due schedules via historical fixtures or test DB date changes;
  they do not wait 30 real days. API date enforcement is separately verified.
- Final preview is reset from the same synthetic seed after E2E so the owner can
  run the complete scenario; E2E screenshots describe the tested run, not that
  fresh preview's initial state.
