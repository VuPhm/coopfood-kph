# KPHON02 technical evidence

12/11/2026, revision1, candidate `1a21ab5f61af6a410fc64b7bd0b1a1d974f11785`.
Branch `store-app/kphon02-lookup-history`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/kphon02-lookup-history`.
Base `0c37581027ea942528168d96cd8f9f46d9c6993f`; sole writer root.
Implementation checkpoint includes test scripts/fixture and product/current/next docs.
Later commits only update this delivery directory. Owner gate pending.

## Outcome and review

Lookup uses existing typed gateway, actor/store/barcode query namespace and abort
signal. FOUND preserves string IDs/leading zero. NOT_FOUND permits rescan/blank
manual draft with explicit status/barcode; no guessing/save. 401/403 refresh
scope;503/network retain retry, never become miss.
History uses existing D01 backend page/filter/sort/count metadata,25/page.
Changing parameters resets page/detail/group; changing page resets detail/group.
Placeholder rows are busy and disabled; errors/invalid dates hide old records/counts.
Selected detail derives from current page ID rather than an old record copy;
page clamp handles zero total pages. Snapshot barcode now survives gateway mapping.
Detail uses accepted shared sheet/list/viewer, private stamped photo endpoint.
No create/review/export/selection mutation controls in this read-only slice.

Scope refresh is coalesced for focus/visibility and masks/inerts mounted content
plus portal dialogs. Draft and scroll survive successful verification; error/revoke
removes scope, and another actor requires explicit store selection. No browser
persistence or mock fallback. Header account focus preserves the current scroll.

Review1 identified stale counts/detail and403 handling in reused BE05 components;
adapted to KPHON01 capabilities/path and current contracts. Review2 verified final
candidate. Real browser found mobile toolbar intercepting pagination: added bottom
clearance, then reran real pointer clicks. Selector failures (duplicate barcode text,
stamped route shape, placeholder timing, native select labels) were corrected in
checks/accessibility; final checks below passed. This is targeted implementation QA,
not the deferred full UI/UX or combined technical review.

## Commands and actual results on candidate

```sh
npm run check -w @coopfood-kph/store-pwa
npm run test -w @coopfood-kph/store-pwa -- src/store-barcode-lookup.test.tsx src/store-online-kph.test.tsx src/store-online-app.test.tsx src/store-session-api.test.ts src/online-kph.test.ts src/app.online.test.tsx
npm run build -w @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=false VITE_STORE_APP_ONLINE=true VITE_KPH_ONLINE=true npm run build -w @coopfood-kph/store-pwa
node e2e/scripts/check-kphon02-lookup-history.cjs
git diff --check
```

- TypeScript PASS. Vitest **6 files,43 tests passed**,0 failures (7.57s).
  Covers lookup miss/error/race/scanner callback, D01/filter/page/detail, session
  revoke/downgrade/expiry/offline, masked draft persistence, actor change and legacy online.
- Mock build PASS (92 precache entries); online build PASS (88), both generate
  sw.js/workbox. No dependency/lockfile change.
- Real-backend Playwright PASS **390×844 and1440×1024**, vi-VN/Asia_Ho_Chi_Minh,
  headless Chromium, reduced motion. No route/API mocks. Each viewport verifies
  real region manager with no membership, cross-region403, FOUND SKU000042/NCC000007,
  NOT_FOUND blank manual + focus draft,30 records split25/5, replacement rather than
  append, quantity sort ascending, approval/date filters + invalid range,
  full detail barcode, stamped image decoded/authenticated200 and anonymous401,
  session invalidation to login with old rows removed, no horizontal overflow
  and no mock operational data. Browser pageerror list empty.
- Local screenshots/results: `.local/verification/kphon02/` (gitignored); viewed
  mobile manual/detail and desktop lookup screenshots. Raw logs copied there.
- No backend/API/migration change. Backend scope/catalog test evidence remains
  [KPHON01](../kphon01-effective-context/evidence.md) at its original SHA; not
  reported as a new backend suite or full verification in this slice.

## Runtime and fixture isolation

Store4173 runs KPHON02 launcher. Backend8082 runs unchanged KPHON01 jar
from its existing target; backend source is identical to candidate (git diff
base→candidate for backend/contracts/packages/root lockfile empty).
Docker was initially stopped; started OrbStack. Prior ADMIN03 acceptance container
was absent, so created **new** `coopfood-kph-kphon02-acceptance` PostgreSQL17-alpine
on loopback55434, database `coopfood_kph_admin03_acceptance`. Applied existing
`admin03-membership.sql`, then new `kphon02-lookup-history.sql` once.
New fixture refuses a different database or existing catalog/history; no truncate,
no operational workbook/photo/data.30 JPEG original/stamped fixtures from existing
synthetic media generator under `.local/runtime/kphon02/media/kphon02-paging`.
No other database/container reset. Admin4175 not restored; no main/Pages change,
no push/deploy. Services currently run as local exec processes, not installed jobs.

## Limits and handoff

Owner acceptance remains pending; no user sign-off inferred from earlier “tiếp”.
Manual lookup draft is not a KPH save. Creation/private media/idempotency then
review/export remain subsequent slices. Camera/OS/device behavior, complete
cross-module combinations and final UI/UX require their deferred rounds.
[Preview scenarios and changed files](handoff.md).
