# FRESH01 — one compact Store screen, technical PASS

26/10/2026. Runtime source `1c5182c9c6c856490ff6573316254a6d9d01c989`.
Branch `store-app/fresh01-solid-compact`; root sole writer, no subagent dispatch.
Preview <http://127.0.0.1:4362/#home>, <http://127.0.0.1:4362/#date> and
<http://127.0.0.1:4362/#kph>. Integrated visual acceptance remains pending.
No merge/push/publication. Mainf77034d is clean; Cloudflare stillCOMPACT03r4.

## Changes / files

- Removed `store-density.tsx/css/test`, provider/scope/account setting and storage
  preference. StoreApp/Frame/account and six consumers have one screen composition;
  no hidden comfortable branch or constant flag preserving duplicate JSX.
  Old localStorage values are ignored, never read/written/migrated by this UI.
- `use-store-print.ts` only observes print media. `store-kph-list.tsx` retains
  the same dense screen row, approval by identifier, two tags and conditional
  final approval fallback. Print restores all3labels on the same row DOM.
- `store-kph-create-button.tsx`, `store-report-settings.tsx`: one direct CTA per
  KPH type with icon/chevron, one period/filter row. Removed unused SettingsGroup/
  Row and QuickSort popup/adapters; sort options remain in feature filters.
- `store-material.css` replaces the old glass layer: white/well/brand/deep
  backgrounds, green#007a52, orange accent#c45108, dark readable ink, one soft
  card edge/shadow role. Floating nav/action surfaces are opaque, selected nav
  is solid green. No per-feature pastel palette or new theme preference.
- Button/component/chrome/form owners use stronger soft edges and tiered
  elevation; fields keep matte fill/no outer shadow. `store-home.css` owns Home
  white cards and green/orange icon faces; obsolete Home paint from inherited
  app/mobile layers is removed. Report menu/history/template, notifications,
  shelf/history, account and login use the same roles; semantic state colors,
  timeline/date rules and output stay separate.
- `store-functional-layout.css`, `store-utility-layout.css`, size/record roles:
  larger16–24px group rhythm, toolbar gap12, secondary36px targets, primary/
  field44px, icon face32–36, passive labels20px with12/16 text. DATE and KPH
  filter controls share size. Removed old invisible44px pseudo hitboxes, so
  smaller auxiliary controls do not create overlapping invisible targets.
- `store-screen-layout.test.tsx` replaces obsolete preference tests with current
  account/no-switch, direct CTA callbacks, filter sort, report context and
  same-node print behavior. Retired density comparison scripts are replaced by
  `check-store-solid`, `check-store-actions`, `check-store-loading` and
  `check-store-reflow`; DATE parity and KPH history gates follow current UI.
- Product density/material/size/component docs and CURRENT_STATE/NEXT describe
  the one-screen candidate. No packages/ui/root config/lockfile/dependency,
  backend/API/auth/schema/domain or online/Pilot/Admin implementation changed.

## Commands / actual results

Commands run in this worktree. Browser commands use
`STORE_PREVIEW_URL=http://127.0.0.1:4362`, headless Chromium, synthetic fixtures;
raw logs/results/screenshots under ignored `.local/fresh01/`.

| Command / output | Result |
| --- | --- |
| `VITEST_MAX_WORKERS=2 npm run verify` → verify-final.log | exit0; docs/contracts/generated API/types,347tests: Store294/Admin16/API2/rules19/UI16, full builds/PWA |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/fresh01/build --emptyOutDir` → build-final.log | exit0,117precache; frozen final UI now committed1c5182c |
| `node e2e/scripts/check-store-solid.cjs`, STORE_SOLID_OUTPUT=.local/fresh01/solid-final | exit0,7routes×5viewports; shared palette/edge/depth, labels, secondary bounds, sheet focus, print, no horizontal overflow/mode; four stale-key cases unchanged/unwritten |
| `node e2e/scripts/check-date-kph-parity.cjs`, STORE_DATE_PARITY_OUTPUT=.local/fresh01/parity-final | exit0,4viewports; types/unknown/exact lookup/independent filter, deep link, sheet/focus/account state, explicit unknown KPH choice, text150/200 |
| `node e2e/scripts/check-store-reflow.cjs`, STORE_REFLOW_OUTPUT=.local/fresh01/reflow | exit0,Home/reports/shelf×390/1440/320, both150% and200%; no clipped buttons/text or page overflow |
| `node e2e/scripts/check-store-loading.cjs`, STORE_LOADING_OUTPUT=.local/fresh01/loading | exit0,390/1440; delayed feature neutral labels, same CTA geometry on release, live semantic colors, no mode flag |
| `node e2e/scripts/check-kph-compact-history.cjs`, STORE_KPH_SYNTHETIC_ROUTE=false, STORE_KPH_COMPACT_OUTPUT=.local/fresh01/kph-history | exit0,390/1440/320; real mock grouping/selection/collapse, append29unique/focus/detail; native keyboard/touch tag scrolling in narrow200% case and no fake scroll affordance when labels fit |
| `node e2e/scripts/check-store-notifications.cjs`, STORE_NOTIFICATIONS_OUTPUT=.local/fresh01/notifications | exit0,390/1440/320; groups/collapse, exact lot, reminder/suppression/deduplication, contrast/text150 |
| `node e2e/scripts/check-date-actions.cjs`, STORE_DATE_OUTPUT=.local/fresh01/date-actions | exit0,390/1440/320;1/7day reminders/cancel/due, TPCN/TPTS prefill/validation/photo/review/save/single record/resolved; explicit unknown choice |
| `node e2e/scripts/check-store-actions.cjs`, STORE_ACTIONS_OUTPUT=.local/fresh01/actions | exit0,390/1440; real zero/photo validation/focus/review/save, form150/200, KPH handoff, report Excel structure/PDF7rows/history and shelf rule |
| `node e2e/scripts/check-store-scrollbars.cjs`, STORE_SCROLLBARS_OUTPUT=.local/fresh01/scrollbars-final | exit0,7routes×5viewports plus dialogs; native wheel/thumb drag, lock/restore, overflow |

Source search also confirms no retired density mechanism in Store runtime.
347 replaces352 because preference-specific behavior was removed and replaced
with meaningful single-screen/output tests; no business/integrity test was waived.
Existing schema format and ExcelJS large-chunk warnings remain.

Full verify and transaction/output evidence are from7e5f623. Subsequent runtime
changes are CSS-only: darker shelf accent text, common36px DATE filter,12px
metadata gap and removal of obsolete pseudo hitboxes. Final mock build, solid/
DATE parity/reflow/KPH history/loading cover those repairs. Business functions,
React transaction/state/print code, shared packages and output logic are unchanged;
347unit/contract and transaction evidence is reused for these unchanged scopes.
Final record/document commits add no runtime change after1c5182c.

## Review and repairs

Bounded root review2/2, no unresolved technical blocker or new audit loop.
Root inspected mobile Home/KPH/DATE/reports/notifications, form200% and final
1440 DATE/shelf screenshots. Confirmed both tags retain their containers.

- Shelf count orange on the new well measured4.225:1, below the gate4.5. Added
  a darker accent-ink role#9c410b; solid gate now passes all pages/viewports.
- Large-text gate caught the old invisible44px target extension behind36px
  filter controls. Removed that retired pseudo layer; current reflow passes.
- Legacy KPH visual gate assumed all3labels always overflow and rows/labels
  were60/26px. Current explicit roles are56/20; tests use those thresholds,
  retain44px real openers, and verify actual overflow/keyboard/touch at narrow
  200% plus non-focusable fitting strips. Sort/create selectors follow the
  current actions. Workflow assertions remain intact.
- A preview stopped during the deliberate turn interruption; connection-refused
  attempts are environment failures. Same frozen4362 build was restarted and
  affected gates rerun; raw connection-refused logs retained separately.

## Handoff / limits

At4362 open Home → DATE/KPH → filter/detail/form; open Tài khoản and confirm
there is no appearance switch. Compare stronger accents, soft card edges/depth,
smaller auxiliary controls and larger group gaps across features. Next small
step: owner visual review of this integrated candidate, not another broad audit.

No main merge/push/Cloudflare update. Data remains the existing mock session;
reload resets session changes, browser report history keeps its existing behavior.
Headless/emulated touch evidence does not establish Safari or physical-device
one-hand usability. User acceptance remains separate from technical PASS.
