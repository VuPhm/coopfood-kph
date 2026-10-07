# Technical evidence — revision 2

Date: 2026-10-07. Candidate SHA: `31fc41a64e8430fceddbd4041f85f77fb87e7ec0`.
Scope: Figma `aEDpXtz0IiEkPiVucqjQ3Q`, mobile and desktop, memory-only mock.

## Workspace and contract

- Branch `store-app/figma-mobile-implementation`, base checkpoint
  `f3ccacc5d3ded89fad04fec546b7ddc4b1d5b8fe`.
- `npm run verify` PASS on the candidate tree: docs/fixtures, contract lock
  (23 manifest resources, 15 API fixtures), generated API drift check, all workspace
  TypeScript checks, 20 Store PWA test files / 138 tests, all other workspace tests,
  and production builds including PWA generation. No generated API diff.
- Build emitted non-fatal chunk-size / ExcelJS dynamic-import warnings. No API,
  OpenAPI, schema, or production controller changes are included.
- `git diff --check` PASS.

## Browser evidence

Both scripts use the local Vite app with `VITE_STORE_APP_MOCK=true` and headless
Playwright. Each check waits for image assets and records screenshots under the
ignored `.local/figma-mobile/` folder, so they are fresh local evidence rather than
committed design assets.

- `node e2e/scripts/check-figma-mobile.cjs` PASS at 390×844 and 1440×1024.
  Both runs cover navigation, filter reset, page-local selection, actual downloaded
  workbook worksheet and eligible-row contents, product lookup found/miss/unavailable,
  scanner manual fallback, evidence viewer, create → review → edit → submit, shelf
  calculation and DATE disabled action, overflow and local asset integrity.
- The workflow check resizes an open draft between 390×844 and 1440×1024 and back;
  product draft, all 3 ordered photo controls and visible footer remain present.
  Review/edit returns to the form start and restores barcode focus on desktop.
  Desktop review asserts three sections share their top edge, initial scroll is zero,
  modal height is 563–565px and rendered header is 68px. Review screenshot:
  `.local/figma-mobile/review-1440.png` (fresh 2026-10-07 14:41).
- `store-create-review.test.tsx` verifies review does not save, editing preserves the
  original photo, a simulated submit error is announced, and retry succeeds with the
  same idempotency key. Three-photo display is also checked in the browser flow.
- `node e2e/scripts/check-figma-responsive.cjs` PASS at 390×844, 599×900, 600×900,
  899×900, 900×900, 1440×900 and 1440×1024. Each viewport checks shell/workspace
  geometry, KPH, Lookup/DATE routing, keyboard-operated quick panel with Escape and
  focus restoration, shelf calculation, exact local icon geometry, and no horizontal
  overflow. At desktop sizes the script asserts full-width app composition, 224px rail,
  visible identity text, keyboard-accessible KPH row detail, lookup and DATE surfaces.
- Deterministic lookup regression uses the fixture expiry dates against
  `Asia/Ho_Chi_Minh` business date 2026-10-07; remaining days are derived rather than
  hardcoded by status. KPH selection follows D01: reset on type/filter/search/sort/page
  changes; select-all affects only the current visible page/type.

Fresh primary screenshots include `.local/figma-mobile/home-390.png`,
`home-1440.png`, `kph-390.png`, `kph-1440.png`, `create-empty-tpts-390.png`,
`create-empty-tpts-1440.png`, `review-390.png`, `review-1440.png`,
`create-empty-tpcn-390.png`, `create-empty-tpcn-1440.png`, `review-tpcn-390.png`,
`review-tpcn-1440.png`, `shelf-390.png`, `shelf-1440.png`, `date-390.png`, and
`date-1440.png`. These PNGs are local and ignored by Git.

## Semantics and limits

- TPTS retains contract options; theme only affects presentation. The KPH create
  action opens the currently selected type. Desktop Lookup remains product/lot search;
  shelf-life calculator is its separate utility. DATE “Thêm theo dõi” remains disabled.
- All fixtures and writes are in memory. This does not verify a backend/API, real
  device camera permission, production data, or owner visual acceptance. No Figma frame
  was changed, and pixel parity is not claimed for the screens without exact references.
- User acceptance gate remains pending until the owner reviews the running preview
  and responds to the scenarios in `acceptance-handoff-r2.md`.
