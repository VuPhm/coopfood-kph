# Technical evidence — revision 5

Date: 2026-10-08. Reviewed base `ecebee861a32d91ce113727d92cb20fbb9a06a83`; branch `store-app/figma-mobile-implementation`; worktree `/Users/vup/Documents/coopfood-kph`. Integrated candidate `ef80ed0cfb1a141d30e3e036483dcd0b3312897f` is recorded in [plan](plan.json). All application checks ran on the final implementation working tree before the scoped candidate commit; only cycle evidence/ledger is finalized afterward.

## Findings and implementation

| QA finding | Repair and verification |
| --- | --- |
| Duplicate KPH fixture IDs | Generated fixture IDs have a separate namespace. One selection exports one record; review leaves the unrelated fixture intact; no duplicate React keys. |
| DATE reset on navigation/Home stale count | StoreApp owns session lots, shared with Home and DATE. Resolve → Home → DATE retains status/count. |
| Mobile DATE backwards transition | Both compositions use the same guarded handler; resolved cannot be changed, acknowledged cannot be acknowledged again. |
| Quick shelf leaks routes/duplicate IDs | Hash navigation closes panel, rendering is limited to KPH/DATE; explicit quick instance ID prefix separates calendar/input labels. |
| UPC presented as SKU | FOUND draft carries catalog SKU only while lookup barcode matches input. Mock record stores separate strings, searches both and exports actual SKU. NOT_FOUND has no invented SKU. Online payload mapping remains explicit and does not serialize the added presentation field. |
| Hardcoded product metadata | Explicit synthetic metadata keyed by fixture product ID; missing metadata renders unavailable, no name inference/API schema additions. |
| Small mobile hit areas | Transparent 44px minimum hit areas preserve visual dimensions. Actual pointer clicks outside visual bounds exercise controls. |
| Lookup submit invisible/clipped | Reuse store-button presentation and frame desktop CTA 112×36, brand fill, white label. Computed contrast/color distinction, no label overflow and screenshots checked. |
| Stale aggregate asset expectations | Read r3 slot geometry and r4 per-source render dimensions; retain all original workflow/Excel assertions. |

Figma MCP structured contexts and screenshots were read before edits from file `aEDpXtz0IiEkPiVucqjQ3Q`, nodes `21:91`, `21:56`, `21:144`, `384:514`, `510:2094`. Existing assets/components/tokens reused. No Figma writes, new assets or dependencies. Independent implementation candidate screenshots are under `.local/figma-mobile/r5/`.

## Runtime and commands

Local Node.js v26.0.0; Playwright 1.62.0 headless Chromium revision 1234; Vite mock development preview <http://127.0.0.1:5175/>. Headless browser launch used the approved sandbox escalation; no Computer Use or real OS/hardware interaction.

- `npm run check --workspace @coopfood-kph/store-pwa` plus focused tests for StoreApp, DATE, KPH, lookup, shelf and create/review — PASS, 22 tests / 6 files. Regression tests exercise session/transition boundaries, separate identifiers, fixture identity and label isolation.
- `npm run verify` — PASS on the final application tree: docs, Contract Lock (23 manifest resources / 15 API fixtures), generated API drift, workspace TypeScript, **193 tests** (Admin 14, Store PWA 151 / 21 files, API 2, rules 19, UI 7), production builds. Existing schema-format informational messages, ExcelJS mixed import and large-chunk warnings remain; no generated API diff.
- `node e2e/scripts/check-store-qa-repairs.cjs` — PASS 390×844 and 1440×1024: isolated selection/review/export, catalog SKU/UPC and new-record workbook, DATE session/count/guards, quick route/unique IDs, metadata, readable CTA, mobile expanded hit areas. No uncaught page errors or duplicate-key warnings. Raw assertions: `.local/figma-mobile/r5/qa-repairs.json`.
- `node e2e/scripts/check-figma-mobile.cjs` — PASS 390×844 and 1440×1024: navigation/filter/selection/export workbook, lookup FOUND/miss/unavailable, scanner manual fallback, images/viewer, resize retaining draft, review/edit/send, shelf validation, DATE actions, asset geometry and no horizontal overflow.
- `node e2e/scripts/check-kph-calendar-icons.cjs` — PASS 390×844 and 1440×1024: both KPH kinds, exact source/stroke/20px render, disabled read-only detected date, picker select/Escape/expanded state/focus restoration.
- `npm run check:docs` — PASS (`Docs/fixtures foundation hợp lệ.`); `git diff --check` — PASS, no whitespace errors. Delivery acceptance consistency passed at documentation checkpoint `731ca9a`; application/browser scripts are identical to candidate `ef80ed0`.

Manual screenshot inspection covered mobile single selection/resolved DATE and desktop fresh lookup, including the repaired green CTA. The preceding QA baseline is `ecebee8`; the five P2 reproductions and two P3 assessments are preserved locally in `.local/qa-ui-2026-10-08/report.md`. The table above preserves their scope in tracked evidence without committing screenshots/workbooks.

## Limits and handoff

The mock state survives route changes within the session, not reload. Fixture metadata is synthetic and local. Mobile search remains hidden by the accepted composition; the browser gate temporarily switches to desktop for SKU/UPC search without resetting its created record. No claim of backend/API/persistence/security/hardware verification for this UI round. Build uses online entry; browser checks target the mock dev entry. Owner acceptance is pending, with scenarios in [handoff](acceptance-handoff-r5.md). No merge/push/deploy or next review round is authorized by technical PASS.

## Browser stdout

```text
PASS 390x844: isolated selection/review/export, catalog SKU/UPC, DATE session/guards, quick route/IDs, lookup metadata, mobile expanded hit areas
PASS 1440x1024: isolated selection/review/export, catalog SKU/UPC, DATE session/guards, quick route/IDs, lookup metadata, mobile expanded hit areas
PASS 390x844: navigation, filter, selection, Excel download, lookup found/miss/unavailable, scanner fallback, image viewer, review/edit/send, shelf rule, DATE action, overflow/assets
PASS 1440x1024: navigation, filter, selection, Excel download, lookup found/miss/unavailable, scanner fallback, image viewer, review/edit/send, shelf rule, DATE action, overflow/assets
PASS 390x844: both KPH icon sources/colors at 20x20, read-only detected date disabled, picker Escape/select/focus and accessible labels
PASS 1440x1024: both KPH icon sources/colors at 20x20, read-only detected date disabled, picker Escape/select/focus and accessible labels
```

## Delivery consistency

`node tooling/skills/delivery-cycle/scripts/cycle.mjs check --repo /Users/vup/Documents/coopfood-kph --plan docs/delivery/figma-mobile-implementation/plan.json --phase acceptance` — exit 0 on the clean checkpoint:

```text
PASS acceptance: figma-mobile-implementation revision 5. Record checks only; verify evidence truth separately.
```

All required technical gates reference candidate `ef80ed0` via the full SHA in plan.json; the required user gate is pending. This validates ledger consistency and does not represent owner sign-off. After the candidate, commits change only this cycle's records.
