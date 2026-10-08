# Technical evidence — revision 4

Date: 2026-10-08. Code candidate SHA: `b60141da4e6b0574e0bfe5a5f6615eca8366a34e`. Branch: `store-app/figma-mobile-implementation`. Worktree: `/Users/vup/Documents/coopfood-kph`. Reviewed checkpoint: `4031c62b985e3679efac11a52d9ee4df31b0cc47`.

## KPH calendar fields and preserved behavior

Figma file `aEDpXtz0IiEkPiVucqjQ3Q` was re-read at mobile nodes `203:701` and `203:847`, plus desktop nodes `384:1072` and `540:1685`. The field assets are assigned per KPH screen in [assets-r4.json](assets-r4.json):

- Detected date uses the exact local 20×20 muted Feather Calendar source, stroke `#667366` and width 1.66667. Its input stays read-only and its trigger stays disabled.
- Treatment date uses the exact local screen-group Feather Calendar source, 24×24 root rendered at 20×20, stroke `#006633` and width 2. TPCN and TPTS use their own Figma exports.
- `CalendarInput` accepts an optional icon node. Without it, existing consumers continue rendering the default Lucide CalendarDays. The KPH assets are injected only by the `presentation="screen"` form callsites.
- Trigger labels, `aria-expanded`, portal placement, date parsing and keyboard flow remain intact. No business date, workflow, Figma frame, dependency, API, backend or shared UI change was made.

## Verification

- `npm run verify` — PASS on code candidate `b60141d`: docs/contract checks, generated API drift, TypeScript checks, tests and production builds. Results: Admin 14 tests, Store PWA 143 tests / 20 files, API 2, KPH rules 19, UI 7. Existing non-fatal ExcelJS dynamic-import and large-chunk warnings remain.
- `npm run test --workspace @coopfood-kph/store-pwa -- src/calendar-input.test.tsx src/create-record-dialog.test.tsx` — PASS, 27 tests.
- `STORE_APP_URL=http://127.0.0.1:5175 node e2e/scripts/check-kph-calendar-icons.cjs` — PASS, headless Chromium at 390×844 and 1440×1024. Both TPCN/TPTS cases checked exact source filenames, SVG stroke colors, 20×20 rendered geometry, read-only/disabled detected date, accessible trigger labels, expanded state, picker selection, Escape closing, and focus restoration after Escape and selection.
- `git diff --check` — PASS. The candidate commit is clean.

Fresh viewport screenshots (captured without full-page background rows):

- `.local/figma-mobile/kph-calendar-203-701-390x844.png`
- `.local/figma-mobile/kph-calendar-203-701-treatment-390x844.png`
- `.local/figma-mobile/kph-calendar-203-847-390x844.png`
- `.local/figma-mobile/kph-calendar-203-847-treatment-390x844.png`
- `.local/figma-mobile/kph-calendar-203-701-1440x1024.png`
- `.local/figma-mobile/kph-calendar-203-847-1440x1024.png`

## Limits

The preview uses synthetic in-memory fixtures. Browser coverage verifies the requested KPH screen presentation and date-picker interaction, not production API/persistence or physical-device behavior. Revision 3 DATE evidence remains historical and unchanged. Owner visual/workflow acceptance is still pending.
