# BE04 — technical evidence, revision1

31/10/2026. Root sole writer. Implementation checkpoint `2059519`; final focus
correction `fc87084df7a4da49bd66d3ef1455d2452df20a36`. Candidate identity recorded
below/plan. No subagents, merge, push or deployment. UI remains provisional per
owner “tạm, giao diện chưa xong, tiếp”. Only authorization scope decision is
explicitly accepted: “Theo backend: quyền KPH vùng/chuỗi được tra”.

## Commands and actual outcomes

| Command | Result / local ignored log |
| --- | --- |
| `npm ci --offline --ignore-scripts`; `npm ci --prefix e2e --offline --ignore-scripts` | PASS, no dependency/lockfile changes |
| `npm run generate:api`; `npm run check:contracts` | PASS,24manifest resources/16API fixtures; existing found/miss examples reused inline in OpenAPI; generated docs align scope |
| `VITEST_MAX_WORKERS=1 npm run verify` | PASS363tests:Store310/Admin16/API2/rules19/UI16; docs/contracts/generated drift/TypeScript/all builds/PWA; `.local/be04/verify.log` |
| `env JAVA_HOME=$(/usr/libexec/java_home -v 21) ./mvnw -B verify` from backend | PASS76tests,0failures/errors/skips, clean PostgreSQL17 Testcontainers migrations; `.local/be04/backend-verify.log` |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=1 src/store-barcode-lookup.test.tsx src/store-online-app.test.tsx src/store-session-api.test.ts` | PASS16targeted tests on final focus source; `.local/be04/component-final.log` |
| `VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/be04/online-dist --emptyOutDir` | PASS88precache final source; `.local/be04/online-final.log` |
| `E2E_BE04=true E2E_APP_URL=http://127.0.0.1:4382 npm --prefix e2e test -- be04-barcode-lookup.spec.ts` | PASS6tests/17.2s final source, both390×844/1440×1024; `.local/be04/browser-final.log` |
| `npm run check:docs`; `git diff --check` | PASS |

Full frontend/backend verification started at2059519. Final focus correction only
adds a local visibility guard for inputs/buttons and a matching E2E geometry
assertion. Domain, API, backend, generated client, dependencies, shell/session and
lookup state machine are unchanged. Reuse full verification for those unchanged
paths; reran16targeted component/API/session tests, TypeScript/online build and all
6real-backend browser cases for the changed component and geometry. This explicitly
records evidence reuse, not a claim that broad tests were rerun after every CSS/UI
review adjustment. No tests/timeouts/security guards were disabled.

## Browser and HTTP coverage

Dedicated PostgreSQL17 container `coopfood-kph-be04-postgres` at127.0.0.1:55434;
backend127.0.0.1:8081; Vite preview4382, proxy override to8081. Existing BE03 runtime
4381/8080/55433 not reset. All records/users/catalog synthetic; no operational
workbook/photo/PII. DB reset to initial fixture after tests for owner preview.

Browser uses real APIs, no response mocking: FOUND with leading-zero barcode and
one product/SKU/NCC; NOT_FOUND clears old product, exposes rescan/manual and retains
barcode/status; manual field starts empty and is cleared on store change. Scanner
entry can return to typed barcode without camera. Region assignment and chain role
without membership can lookup; direct cross-region request403; revoke next lookup
403 with no old product or manual fallback.503 remains unavailable, retry succeeds;
offline remains error;401 invalid credential version returns to login. Screenshots
found/manual at both viewports, horizontal overflow assertion, focus above mobile
navigation. Real hardware decoding/OS camera permission/iPhone Safari are not claimed.

New backend tests prove region allow/deny/cross-region/store move/revoke, chain
role revoke, no synthetic membership, inactive store/region deny. Original initial
fixture tried to deactivate a region containing an active store and correctly hit
`stores_active_region_required`; corrected fixture to deactivate the store first.
Final full76test run passes with the DB constraint intact. Backend main source
is byte-identical to BE03: existing KphStoreAccessPolicy remains authority.

## Files and remaining limits

- Store gateway + OnlineApp composition, new lookup component/CSS/tests; existing
  BarcodeScannerDialog and API gateway reused. Vite proxy override only for isolated
  local runtimes; default8080 unchanged.
- OpenAPI/examples/generated docs, P01/discovery/contract index and ADR0007.
- Two additional backend HTTP tests, dedicated Playwright spec/E2E README, delivery
  state/records and follow-up notes preserving older BE02/BE03 decisions.
- No runtime backend change, migration, dependency, root lockfile or shared UI edit.
- Manual values are ephemeral; no KPH/DATE/report persistence or success-save claim.
  No catalog staging/publish expansion, fuzzy/multiple matches or mock fallback.
- UI acceptance remains pending; owner approval of scope does not approve visuals.
  No remote CI/production deployment/real-device acceptance claim.

## Candidate identity

Candidate `607bcc0c625d38a9e57f3431f52974e75d7803a0` only advances CURRENT_STATE/NEXT overfc87084.
`git diff --exit-code fc87084 HEAD -- apps backend contracts packages e2e package.json package-lock.json`
PASS; all runtime and tests match the final scoped build/browser evidence.
Subsequent record commits are limited to this cycle folder.

Record validation: initial decision belongs to revision1 scope (ADR0007/handoff),
not a revision-change entry; checker requires change entries only from revision2.
Corrected that metadata without changing scope, code, evidence or gate decisions.
