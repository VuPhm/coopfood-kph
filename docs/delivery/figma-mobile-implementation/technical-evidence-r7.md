# Technical evidence — UI repair revision 7

09/10/2026. Authorization: owner “còn rất nhiều lỗi, cứ rà và sửa”. Base
`b180484f7a2377020e5bf4e6354705948ee6382f`; branch
`store-app/qa-20261009-sheet-focus`; isolated worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`. Candidate `0a9b933ce83072260dba530f77b4679959c7c51b` is recorded
in [plan](plan.json). Root is the sole writer; no delegation.

## Findings and changes

| Confirmed defect | Repair / regression |
| --- | --- |
| Controlled StoreSheet loses focus on close | Local opener capture; visible/connected fallback; route-aware return to content. Unit tests and eight filter/Account close cases at both viewports. |
| Account Escape closes quick utility and loses draft | Quick Escape respects active dialog and consumed events; draft survives closing Account. |
| Account remains over another route; delayed focus returns to old header | Route dismisses Account; close-autofocus checks the route captured on opening. Chromium caught the delayed close race beyond jsdom. |
| Screen scanner/create/viewer do not return focus | Opt-in hook on screen presentations and the Store KPH detail viewer; shared UI/Pilot defaults remain intact. |
| Fast nested scanner Escape closes parent form on desktop | Parent resolves Escape to its active child during layer registration. Browser exercises scanner/viewer/calendar closure and verifies the parent and opener remain. |
| DATE and KPH whitespace searches miss valid identifiers | Trim only the search term; leading-zero fixture strings stay unchanged. |
| Lookup unique partial name misses; prior product survives editing | Unique local-fixture name recovery, explicit ambiguity copy, clear product/message on edit. Exact barcode miss remains separate. |
| A delayed lookup response overwrites a newer query | Request generation invalidation on edit/new lookup/unmount; delayed-response regression. |
| DATE desktop displays negative remaining days | Expired/today copy based on Ho Chi Minh business date; deterministic expiry tests. |
| Header/tabs/status geometry, hidden mobile create prefix and misplaced chevron | 72px mobile / 56px desktop header, 40px primary group with 32px tabs, mobile 40px status buttons, 12px CTA label with “Tạo ·”, 20px card chevron at 12px right inset. Expanded 44px targets tested by actual pointer hits. |
| White search glyphs disappear on white KPH/Lookup fields; wrong/faint lookup product glyph | Reuse verified dark Search export and FileText master, consumer dark role, desktop 42px holder / 16px artwork. Manifest r7 preserves prior manifests. Screenshot review checked visible strokes. |
| DATE filter/add controls stack vertically on desktop | Scope action-row flex rule above the heading cascade; DOM center alignment assertion. |

Figma structured context and MCP screenshots read before the relevant edits:
`aEDpXtz0IiEkPiVucqjQ3Q`, `21:91`, `21:144`, `384:514`, `384:897`.
Existing assets/tokens/primitives were reused. No asset-byte, dependency, API,
authorization or domain changes, and no Figma writes. See [asset record](assets-r7.json).

Two bounded review passes completed: consolidated initial defect repairs, then
browser/screenshot integration review. The second pass caught the route focus race,
nested desktop Escape, invisible glyphs and action-row cascade. No broad pixel snapshots.

## Verification

All browser commands use `STORE_APP_URL=http://127.0.0.1:5177` and headless Chromium.
Final logs are local under `.local/ui-r7/`; screenshots/workbooks are synthetic and
not committed. Verification runs on the implementation tree before the candidate
commit; subsequent commits finalize only this cycle's ledger.

- `npm run verify` — PASS: docs, Contract Lock (23 resources / 15 fixtures), generated API drift, all workspace types, **205 tests** (Admin 14, Store PWA 163 / 22 files, API 2, rules 19, UI 7), production builds. Existing schema-format notices, mixed Excel import and chunk-size warnings remain.
- `node e2e/scripts/check-store-sheet-focus.cjs` — PASS 390×844 / 1440×1024: focus, nested layers, quick draft, route dismissal, DATE search, lookup/query coherence, readable icons, geometry and expanded hit areas. Results: `.local/ui-r7/results.json`.
- `node e2e/scripts/check-figma-mobile.cjs` — PASS both required viewports: navigation/filter/selection, Excel, lookup FOUND/miss/unavailable, scanner fallback, images/viewer, review/edit/send, shelf validation, DATE actions, icon geometry and no page overflow.
- `node e2e/scripts/check-store-qa-repairs.cjs` — PASS both viewports: isolated selection/review/export, new-record SKU/UPC workbook, DATE session/count/guards, quick route/IDs, metadata, CTA and touch areas.
- `node e2e/scripts/check-kph-calendar-icons.cjs` — PASS both viewports: both KPH kinds, exact calendar source/stroke/render, read-only date, select/Escape/focus.
- `node e2e/scripts/check-figma-responsive.cjs` — PASS widths 390, 599, 600, 899, 900 and 1440 (900/1024 heights): shell composition, assets, scanner fallback, quick keyboard, shelf rule and no horizontal page overflow.
- `git diff --check` and docs checks — PASS. No generated schema, shared UI, root lock/config, shelf result component/test/script or shelf CSS changes.
- Delivery acceptance consistency is recorded after the candidate checkpoint; required owner acceptance remains pending.

Screenshot inspection covered KPH, DATE and Lookup at both required sizes, including
dark search strokes, FileText role, CTA labels, chevrons and the DATE action row.
Before/after screenshots are in `.local/ui-r7/before/` and `.local/ui-r7/`.

## Boundaries

Technical readiness is limited to the synthetic mock entry and existing production
build. No backend/security/hardware claim, no owner sign-off, merge/push/deploy or
Pages cutover. Original worktree belongs to another task; no writes were made there.
The shelf result draft remains that task's responsibility. Integration of shared CSS
across branches needs owner review. See [owner handoff](acceptance-handoff-r7.md).
