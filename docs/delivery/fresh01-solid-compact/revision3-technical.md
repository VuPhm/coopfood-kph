# FRESH01 revision3 — shared Home lighting and blue fresh CTA

26/10/2026. Runtime `342ca66a4fe5592bd29d3c393c372a6f2ad854ff`.
Preview <http://127.0.0.1:4366/#kph>. Technical PASS; owner acceptance of this
integrated revision pending. Same task/branch/worktree, root sole writer.
Revision2 plan/evidence archived separately;4364 retained as the accepted visual
reference. Owner “ổn” accepts that direction and requests wider item/button use;
it does not authorize main merge or publication.

## Changes / files

- `store-material.css`: extracts the accepted Home light as shared item/control
  ingredients. Neutral/mint light gradients extend to KPH/DATE cards and tables,
  report catalog, notifications and Home attention rows. Checked/active items
  retain their state recipes; business labels/phase colors stay separate.
- `store-home.css`: consumes the shared light without changing its four tints,
  circle icons, geometry or handlers. No wider per-feature rainbow palette.
- `store-utility-layout.css`, `store-notifications.css`: report/template/history
  cards, shelf history and functional icons reuse the material. Avoid double
  paint on nested template cards. No extra wrapper or feature component.
- `store-button-system.css`, `store-component-soft.css`: primary/secondary/danger,
  toolbar/filter/choice/cancel/reset/login and inverse close controls receive
  matching light/edges/depth. Pressed recedes to inset shading; disabled stays
  flat. Rest/hover secondary recipes exclude active state so they cannot hide
  the pressed feedback. Fields remain bright white; high contrast drops decor.
- `store-kph-fresh.css`: warm TPCN and distinct blue TPTS ramps, white text/icons,
  light contour; blue base#2465af / hover#1e5391 / pressed#17467d. Warm CTA is
  darkened enough for the shared highlight. Hover uses its own ramp; press is
  inset with no gradient. No resize/translate across states.
- `store-kph-create-forms.css`: photo actions reuse item light, retaining native
  controls and image workflow. No changes to runtime TS/DOM, business rules,
  API/security/data, packages/ui, root config/dependencies or assets.
- New `check-store-effects.cjs` exercises real mouse/keyboard states and actual
  type-specific form opens. Product/state docs record the broader rollout.

## Verification / commands

Worktree commands; browser common env
`STORE_PREVIEW_URL=http://127.0.0.1:4366`. Synthetic mock data only, raw ignored
artifacts in `.local/fresh01/r3/`.

| Command / output | Actual result |
| --- | --- |
| `VITEST_MAX_WORKERS=2 npm run verify` → verify.log | exit0,347tests (Store294/Admin16/API2/rules19/UI16), docs/contracts/API generation/types/full builds/PWA |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/fresh01/r3/build --emptyOutDir` → build.log | exit0,117precache; frozen runtime342ca66 |
| `node e2e/scripts/check-store-solid.cjs`, STORE_SOLID_OUTPUT=.local/fresh01/r3/solid | exit0,7routes×5viewports, material/contrast/geometry/focus/tag/print/no-mode/overflow and stale-key checks |
| `node e2e/scripts/check-store-effects.cjs`, STORE_EFFECTS_OUTPUT=.local/fresh01/r3/effects | exit0,390/1440/320: default/hover/keyboard-only focus/real mouse-down/disabled CTA states, stable boxes, readable paint and correct TPCN/TPTS form opens; item/icon/button light present, fields white |
| `node e2e/scripts/check-store-material.cjs`, STORE_MATERIAL_OUTPUT=.local/fresh01/r3/material, STORE_MATERIAL_BASELINE_BUILD=.local/fresh01/r2/build, STORE_MATERIAL_BUILD=.local/fresh01/r3/build | exit0,3widths, field states/validation/focus, static decor constraints, payload budget and diagnostic scroll |
| `node e2e/scripts/check-store-actions.cjs`, STORE_ACTIONS_OUTPUT=.local/fresh01/r3/actions | exit0,390/1440: reminder1/7, validation/photo/review/save, KPH handoff, form150/200, Excel/PDF7rows/history and shelf calculation |
| `node e2e/scripts/check-store-reflow.cjs`, STORE_REFLOW_OUTPUT=.local/fresh01/r3/reflow | exit0,Home/reports/shelf×390/1440/320 at150/200%, no clipping/overflow |
| `node e2e/scripts/check-store-loading.cjs`, STORE_LOADING_OUTPUT=.local/fresh01/r3/loading | exit0,390/1440: neutral loading/live labels and same shared CTA geometry; disabled skeleton remains neutral |
| `node e2e/scripts/check-store-notifications.cjs`, STORE_NOTIFICATIONS_OUTPUT=.local/fresh01/r3/notifications | exit0,390/1440/320: collapse, exact lot, reminders/suppression/deduplication, contrast/text150 |
| `node e2e/scripts/check-store-scrollbars.cjs`, STORE_SCROLLBARS_OUTPUT=.local/fresh01/r3/scrollbars | exit0,7routes×5viewports and portals; native wheel/thumb drag, locks/focus/overflow |
| `npm run check:docs`, `git diff --check` | pass |

Conservative contrast includes every gradient-stop/alpha combination. CTA text
minimums, same at all tested widths:

| CTA | Default | Hover | Keyboard focus, pointer away | Pressed |
| --- | --- | --- | --- | --- |
| TPCN | 4.772:1 | 5.679:1 | 4.772:1 | 8.382:1 |
| TPTS | 4.999:1 | 6.379:1 | 4.999:1 | 9.508:1 |

No contrast threshold was lowered. Main and hover/pressed boxes match exactly;
native disabled is a style probe restored before testing real callbacks.
Root visually reviewed390 KPH/DATE/reports/notifications with the shared effect.
One bounded integrated review,1/2, no unresolved blocker or new broad audit.
Existing schema-format and ExcelJS bundle warnings remain unchanged.

## Cost and limits

Built CSS gzip sums: revision2 57103bytes → revision3 57538bytes, **+435bytes**,
under the4096byte budget. No new runtime JS, library, image asset, blur/filter,
continuous animation or persistent will-change. Existing input and state roles
are not decorated into buttons. Static gradients still have paint cost.

A diagnostic390 KPH scroll at4×CPU,45samples, normal motion preference recorded
median16.7ms/p9518.8ms; no infinite running animation after settling. This is a
headless observation, not a controlled device benchmark or battery/FPS guarantee.
Geometry/semantics are unchanged and output is verified; actual Safari/one-hand
use remains for owner/device testing.

## Handoff

At4366 compare item/button light across DATE/KPH/reports/notifications; compare
warm TPCN and blue TPTS, hover/press/focus and open each form. Next small step is
owner visual review; stop further unsolicited rollout. Mainf77034d clean, no
merge/push/Cloudflare update (public stillCOMPACT03r4). Existing mock/reset and
report history limitations remain. Documentation/ledger commits after342ca66
contain no runtime change; evidence applies to that same frozen code.
