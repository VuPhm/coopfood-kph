# COMPACT03 revision8 — DATE/KPH alignment, technical PASS

26/10/2026. Runtime source `5b65094`, branch `store-app/compact03-date-report-items`.
Production mock preview <http://127.0.0.1:4360/#date> and <http://127.0.0.1:4360/#kph>.
Root sole writer; same task/worktree, no new agent loop. Revision7 remains part
of this integrated candidate. Owner accepted the Compact list direction and
requested it in both preferences; integrated visual acceptance is still pending.

## Result and changed files

- `store-density.tsx`, `store-kph-list.tsx`, `store-kph-items.css`,
  `store-record-items.css`, `store-density.css`, `store-fresh-surfaces.css` and
  `store-date-notification-surfaces.css`: one screen-list policy and common table
  row recipe. DATE/KPH list size/composition stays identical across preferences.
  KPH approval stays by identifiers, condition and resolution retain two tags;
  DATE phase and processing both retain tag fill/border/radius/icon, including
  detail processing. Final approval may collapse when space is scarce; pending
  stays readable. Print restores the original full label composition. Settings
  continue to control functional regions/forms without a second preference.
- `store-food-kind-tabs.tsx`: one shared food selector for KPH live, KPH loading
  and DATE. `store-kph-workspace.tsx` / `store-kph-loading.tsx` consume it.
- `store-date-actions.ts`, `store-date-workspace.tsx`: two DATE food tabs replace
  the previous broad status tabs; status/phase move to filter, Cần chú ý remains
  a shortcut. Classification comes only from matching catalog metadata. Three
  mock lots without metadata remain reachable under Chưa phân loại; no guessing.
  Exact SKU/barcode/lot lookup and notification links reveal the correct type.
- `store-date-fresh.css`, `store-sticky-tabs.css`, `store-kph-fresh.css`: mobile
  cards/desktop full-width table open the same existing StoreSheet; old inline
  detail column is removed. Shared sort, list heading, toolbar and sticky tabs
  are reused. Only the multi-consumer food selector is extracted. Large text
  wraps controls and sort labels; percentage and percent sign remain together.
  DATE-specific dates, percentage, timeline and reminder content stay intact.
- `store-density.test.tsx`, DATE/session unit tests and browser checks cover the
  actual new UI. Existing DATE action/density/notification checks now target the
  shared sheet on desktop as well and preserve workflow assertions. New
  `check-date-kph-parity.cjs` and `check-store-list-density.cjs` check food scope,
  unknown types, keyboard/focus, reflow and the common screen-list composition.
- Product DATE/notification/component/density documents plus CURRENT_STATE/NEXT
  document the composition. No contract/API/backend/authorization/schema change,
  dependency, packages/ui change or duplicate feature component.

## Commands and actual results

All browser runs use the production mock build at4360 and synthetic fixtures.
Ignored raw logs, screenshots and results live under `.local/compact03/r8/`.

- `VITEST_MAX_WORKERS=2 npm run verify`: completed docs/contracts/API generation,
  types, all352tests (Store299/Admin16/API2/rules19/UI16), builds and PWA;
  `verify.log`. Existing schema-format and large ExcelJS chunk warnings remain.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact03/r8/build --emptyOutDir`:117precache;
  `build.log`. Preview serves this frozen source5b65094 build.
- With `STORE_PREVIEW_URL=http://127.0.0.1:4360`, run
  `node e2e/scripts/check-store-list-density.cjs` and
  `node e2e/scripts/check-date-kph-parity.cjs`: both exit0,8cases each across
  390/1440/320/900 widths. Exact item geometry/font/second-tag paint match after
  a real preference toggle; same row DOM persists; print composition restores.
  Food tabs, explicit unknown queue, exact lookup, independent status, deep link,
  sheet keyboard/focus, DATE→KPH unknown-kind choice and text150/200 all pass.
  Outputs: `list-policy-final/`, `parity/` and matching logs.
- Same preview, `node e2e/scripts/check-date-actions.cjs`: exit0,390/1440/320,
  actual1/7day reminder/cancel/due notifications and TPCN/TPTS
  prefill/validation/photo/review/save/single record/resolved routing; unknown
  types require explicit choice. `actions.log`, `actions/results.json`.
- Same preview, `node e2e/scripts/check-store-density.cjs`, with baseline also4360:
  five viewport cases plus actual Compact workflow/output cases complete;
  `density.log`, `density/results.json`. Covers toggle/persistence, portals,
  selection/groups/drafts, forced colors, text/print, reminder, KPH creation,
  report/history/Excel/PDF and shelf rules. This self-baseline checks current
  comfortable→toggle→restore, not old comfortable list geometry after the
  owner-authorized list change. This run completed before the interrupted
  preview stopped; source/build remained5b65094 and coverage is unchanged.
- Same preview, `node e2e/scripts/check-store-density-stability.cjs`: exit0,
  30cases/sixroutes/fiveviewports, same-pointer and keyboard toggles, settings
  geometry/scroll/focus; DATE200% input grows. `stability.log/results.json`.
  This asserts controller stability, not universal zero movement of page content.
- Same preview, `node .local/compact03/r4/notification-modes.cjs`, once default,
  once `STORE_UI_DENSITY=compact`: exit0 both, three widths each, exact-lot
  routing/reminder/suppression/deduplication/group collapse/contrast/text150.
  Wrapper only seeds preference and runs the current tracked notification check.
  `notifications.log`, `notifications-compact.log`, corresponding results.
- `UI_URL=http://127.0.0.1:4360 node .local/compact03/r8/loading.cjs`: exit0,
  four width/mode cases, neutral loading tags then actual semantic colors,
  no development CSS injection. `loading.log`, `loading-results.json`.
- Same preview, `node e2e/scripts/check-store-scrollbars.cjs`, once default and
  once `STORE_UI_DENSITY=compact`: exit0 each,7routes×5viewports each. Native
  wheel/thumb drag, dialogs, scroll lock/restore and overflow checks pass;
  `scrollbars-comfortable.log`, `scrollbars-compact.log` and results folders.
- Root inspected production screenshots for DATE/KPH390, DATE1440 and DATE200%
  text at320. Both second tags are visible; narrow controls reflow. No broad
  pixel snapshot introduced. `npm run check:docs` and `git diff --check`: pass.

The first attempts after resume failed with connection refused because preview
had stopped; restarting the same frozen4360 build resolved that environment
failure. Those checks were rerun successfully. Revision7 quick-sort overflow is
fixed and covered by the stricter current reflow check, not waived. Earlier
revision6 evidence is retained in revision6-technical.md; revision7 progress is
retained separately. No previous UI result substitutes for changed current code.
Final status/document commits after5b65094 contain no runtime/test change;
current technical evidence therefore applies to their identical runtime source.

## Handoff and limits

At4360 compare DATE/KPH lists with Chế độ gọn off/on; size and second tags stay
consistent while controls/forms change. In DATE switch food type → filter →
open a lot → Ghi nhận/Xử lý; Chưa phân loại stays available when metadata is absent.
Technical readiness is separate from owner visual acceptance. Main remains
`f77034d` clean; no merge/push or Cloudflare update (public demo still revision4).
Mock session data resets on reload; no real backend/Safari/physical-device claim.
The bounded implementation/review is complete; next small step is owner viewing
this integrated preview, not another unsolicited audit.
