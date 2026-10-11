# Technical evidence — revision 3

Date: 2026-10-08. Candidate SHA: `caaea23e6a2bf86f0b8388f3887684db1ee59c9e`.
Branch: `store-app/figma-mobile-implementation`. Worktree:
`/Users/vup/Documents/coopfood-kph`. Base checkpoint: `f7f60bc3778bf307d15671666551fa10864b79fd`.

## DATE icon source and geometry

Figma structured context and the exact SVG exports were read from file
`aEDpXtz0IiEkPiVucqjQ3Q`, screen `21:144`:

- Search master `25:16`, vector `269:209`: exact local SVG
  `apps/store-pwa/public/figma/0d9947bc-6df8-489b-b0f1-4d3264da3d36.svg`, SHA-1
  `b7961784f801532a97444191e2fb693ebd19243c`. Root 24×24, rendered 18×18 at
  `(left 12px, top 15px)` in the search field. Stroke `#1C261C`, width 2,
  round cap/join.
- Maximize master `25:20`, vector `269:212`: reused local SVG
  `apps/store-pwa/public/figma/29585ac6-4af7-4f2f-a308-2b24ab118b3e.svg`, SHA-1
  `ca525e3f6625501886d6e312b6b146be1a779522`; it is byte-identical to the exact
  exported SVG. Root 24×24, rendered 20×20 inside its 36×36 holder. Stroke
  `#1C261C`, width 2, round cap/join.

The previous generic Search file had a white stroke and is left unchanged for its
other consumers. These local SVG exports do not constitute a `react-feather`
dependency installation or migration. The revision 3 source/slot details are in
[assets-r3.json](assets-r3.json); the revision 2 manifest remains untouched.

## Checks

- `npm run verify` — PASS after the final icon sources were installed. Docs and
  contract checks passed (23 manifest resources, 15 API fixtures); generated API
  drift was clean; TypeScript checks passed across workspaces; tests passed:
  Admin 14, Store PWA 138 across 20 files, API 2, KPH rules 19, UI 7; all
  production builds and PWA generation passed. Existing non-fatal ExcelJS
  dynamic-import and large-chunk warnings remain.
- `VITE_STORE_APP_MOCK=true STORE_APP_URL=http://127.0.0.1:5175 node e2e/scripts/check-figma-responsive.cjs`
  — PASS, headless Chromium at 390×844, 599×900, 600×900, 899×900, 900×900,
  1440×900 and 1440×1024. Each viewport checked the DATE SVG filenames, exact
  rendered dimensions and search placement, scanner button accessible name,
  scanner opening, manual input fallback, existing quick-panel keyboard flow,
  shelf calculation and horizontal overflow.
- `git diff --check` — PASS.

Actual per-viewport DATE output:

```text
PASS 390x844: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 599x900: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 600x900: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 899x900: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 900x900: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 1440x900: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
PASS 1440x1024: search 18x18 at 12x15; scan 20x20 in 36x36; exact Search/Maximize SVG sources; scanner manual fallback
```

Fresh screenshots (ignored local evidence): `.local/figma-mobile/date-390x844.png`
and `.local/figma-mobile/date-1440x1024.png`.

## Limits

The preview uses synthetic in-memory fixtures. This verifies icon source/placement
and the scanner dialog/manual entry behavior in browser, not camera permission on
physical devices or production DATE persistence/API behavior. No Figma frames
were changed. Owner visual/workflow acceptance remains pending.
