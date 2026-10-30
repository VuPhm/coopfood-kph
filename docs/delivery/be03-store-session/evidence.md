# BE03 technical evidence — revision 1

31/10/2026, root sole writer; Java21, PostgreSQL17-alpine disposable
`coopfood-kph-be03-postgres` on loopback55433, backend8080, Store preview4381.
No operational database, workbook or photos. Backend/contracts/packages/lockfile
are byte-identical to BE02 checkpoint2b42c94; its74backend tests remain prior
BE02 evidence, not a fresh BE03 full backend test run.

## Commands and results

- `npm ci --offline --ignore-scripts`, `npm ci --prefix e2e --offline --ignore-scripts`:
  PASS, no dependency/lockfile edits; isolated worktree workspace resolution.
- `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=1 src/store-session-api.test.ts src/store-online-app.test.tsx`:
  PASS7tests,2files (`.local/be03/component-final.log`). Effective scope without
  membership; employee/manager capabilities, switch/reset, revoke/network/401,
  no mock login fallback, password whitespace, empty scope/logout and authenticated
  no-store discovery/abort/string identifier.
- Initial `VITEST_MAX_WORKERS=1 npm run verify`: PASS352tests and all contract,
  generated API, TypeScript/build/PWA checks (`.local/be03/verify.log`). It predates
  the2gateway tests and final presentation correction. Final full run recorded below.
- `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/be03/final-online --emptyOutDir`:
  PASS,87precache (`.local/be03/online-final.log`). Preview fixed output at4381.
- `E2E_BE03=true E2E_APP_URL=http://127.0.0.1:4381 npm --prefix e2e test -- be03-store-session.spec.ts`:
  PASS6tests/23.2s against real Spring Boot + PostgreSQL, no mocked API
  (`.local/be03/browser-final.log`, `e2e/artifacts/test-results/`). Both headless
  390×844 and1440×1024: employee exact scope; region without membership;
  chain3stores; CSRF logout; explicit store switch; revoke membership/assignment;
  credential invalidation; offline hides old scope and reconnect rechecks;
  self-password change requires new login/password. Both screenshots inspected;
  no horizontal overflow. DB reset to original synthetic fixture after tests.
- `npm run check:docs`, `git diff --check`, and
  `git diff --exit-code 2b42c94 -- backend contracts packages package.json package-lock.json`: PASS.

Initial browser run caught a test selector waiting for Retry after reconnect had
already refreshed successfully; corrected to assert automatic recovery. Its
remaining stale run was stopped; final complete6case run passed with unchanged
90second timeout and full assertions. Screenshot review corrected stretched grid
rows and wrapped account text before the final build/browser pass.

## Scope and limits

New files: `store-session-api.ts` plus tests; `store-online-app.tsx`/CSS plus tests;
entry opt-in in `main.tsx`; dedicated real-backend browser spec and E2E README;
CURRENT_STATE/NEXT and this cycle's records. No API/migration/shared UI change.
Login uses existing gateway session/CSRF; no new auth mechanism or fake role.

Owner UI acceptance pending. No merge/push backend/deployment/Pages/remote CI.
No real-device Safari claim. No business requests yet: refresh validates navigation
scope, while every future business request must still authorize on the backend.
Catalog inherited access is explicitly deferred; KPH/DATE/report data is not wired.
