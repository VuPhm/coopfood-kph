# COMPACT03 revision6 — quick fixes, technical PASS

Date26/10/2026. Candidate `cddd729c5f46f241f07e162a8a31751166eaccc2`.
Preview <http://127.0.0.1:4356/#kph>. Root sole writer; three requested fixes,
no new agent/audit round, business/state/API/auth/dependency change or publication.
Prior evidence preserved in revision5-plan.json / revision5-technical.md.

## Result / files

- `store-kph-items.css`: resolution/Biện pháp retains its original tag border,
  radius, fill and icon in Compact mobile and desktop. Approval icon fallback
  and the accepted condition/approval hierarchy are retained.
- `store-kph-create-button.tsx`: Compact adds a trailing aria-hidden chevron;
  accessible names, dialog semantics, handlers and loading/live component stay shared.
- `store-button-system.css` / `store-kph-fresh.css`: soft orange/mint create
  surfaces with hover/pressed feedback. Comfortable copy uses two levels on one
  surface, removing the nested colored bar. Measured comfortable66px mobile,
  80px desktop; Compact44px at320/390/1440. Padding8px/gap6px reserves arrow space
  on narrow cards without reducing font or hit targets (`store-density.css`).
- `store-form-soft.css`: existing Store field tokens become matte #f3f6f4,
  edge16%, radius12, no outer shadow/sheen. Keep label/value/keyboard, input16px,
  focus outline/green edge, error red, readonly/disabled distinction and sizing.
  Existing Store/login scopes are retained; online/Pilot/Admin untouched.
- CURRENT_STATE/NEXT, product STORE_APP_SURFACE_STYLE and this folder document
  scope, decisions and validation. No new dependency/component abstraction.

## Apple reference / interpretation

Read official [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)
and [Materials](https://developer.apple.com/design/human-interface-guidelines/materials),
including their official Markdown versions, plus [iOS27](https://images.apple.com/os/ios/).
Apple distinguishes content-layer materials from floating functional/navigation
materials, and emphasizes field purpose, labels, spacing and predictable input.
The matte field/soft action split is our Co.op Fresh web interpretation, not a
claim that Apple specifies these exact hex values, radius or a pixel-identicaliOS field.
UI/UX skill focused search “input affordance focus” matched Input Affordance.

## Checks / actual results

Artifacts ignored under `.local/compact03/r6/`, synthetic mock data only.

- `VITEST_MAX_WORKERS=2 npm run verify`: exit0,346tests (Store293/Admin16/API2/
  rules19/UI16), docs/contracts/API generation/types/build/PWA. verify.log.
- Mock build command `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa
  run build -- --outDir ../../.local/compact03/r6/build --emptyOutDir`: exit0,
  final117precache, build-final.log. Baseline ExcelJS large-chunk warning remains.
- `node .local/compact03/r6/quick.cjs`: exit0, both modes390/1440/320. Actual
  resolution border/fill, both CTA chevrons/hit targets, hover/pressed response,
  both form opens, matte input16px/min44, focus, real quantity0 validation and
  error paint, CTA text200%/no horizontal overflow. quick-final.log and
  quick-results.json; root inspected mobile comfortable/Compact and form screenshots.
- `STORE_PREVIEW_URL=http://127.0.0.1:4356 STORE_BASELINE_URL=http://127.0.0.1:4356
  STORE_DENSITY_OUTPUT=.local/compact03/r6/density-final
  node e2e/scripts/check-store-density.cjs`: exit0, five viewports, real density
  toggle/persistence/fallback, settings/state/draft/selection/group/reading test,
  portal bounds, forced colors, print/reflow150/200; Compact DATE1/7 reminder,
  TPCN/TPTS validation/photo/review/save, KPH, report/history/Excel/PDF, shelf rules.
  Self-baseline deliberately checks current comfortable→toggle→restore; it does
  not assert old comfortable CTA geometry parity after the authorized redesign.
- `STORE_PREVIEW_URL=http://127.0.0.1:4356
  STORE_DENSITY_STABILITY_OUTPUT=.local/compact03/r6/stability
  node e2e/scripts/check-store-density-stability.cjs`: exit0,30cases/sixroutes/
  fiveviewports, same-position pointer + keyboard, settings geometry/body scroll,
  focus return and DATE200% input growth. stability.log/results.json.
- `npm run check:docs`, `git diff --check`: pass. Main remainsf77034d clean.

Verify/stability/density ran on2e9006a source. Final change only narrows Compact
CTA internal gap8→6 and inset12→8, with no form/domain/controller/output changes.
Final mock rebuild and all six targeted UI cases run after that adjustment;
all Compact CTAs measure44px, including320 (previous arrow candidate needed58px).
Full workflow/state and unit evidence is reused for unchanged code scopes.

## Explicit diagnostic limit

An extra320 probe (comfortable→Compact, selection mode, scroll64, first row)
measured row top458→454 (4px). The identical probe on frozen4354 gives exactly
458→454, including after fonts/animations/two frames settle. Raw anchor.log,
anchor-settled.log and anchor-baseline.log retain the failed≤2 assertion.
This is a pre-existing row-anchor calibration edge, not a new CTA/tag/form
regression; the existing density reading test and settings-controller stability
remain passing. Do not claim universal0px page movement from the controller test.
Broader anchor work is deferred outside this quick requested slice.

## Handoff

Owner compare tag, two create actions and open either form at4356 in both modes.
Technical readiness is separate from visual owner acceptance. No main merge/push
or Cloudflare update; public demo remains revision4. Mock reminders/KPH reset on
reload, no real backend/Safari/physical-device claim. Production4356 session65925.
