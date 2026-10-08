# Technical evidence — combined UI/shelf result revision 8

09/10/2026. Owner authorization: “gộp với mục này”, with the shelf result follow-up.
Same cycle, sole writer /root, branch `store-app/qa-20261009-sheet-focus`, worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`. Target base
`bd7cd865e1b4fda14b647101570cb4556c5ee9bc`; candidate `081c7117d814a53207134fddda4c9009a043f9f1` is recorded in [plan](plan.json).
Revision 7 evidence remains historical; all technical gates are rerun on the combined tree.

## Integration and provenance

The source is an uncommitted snapshot from `store-app/figma-mobile-implementation`,
`/Users/vup/Documents/coopfood-kph`, HEAD `b1c772f4753ad13db1a7930a484ac7933b73b383`.
Five source files were captured before integration; SHA-256 hashes and the tracked
patch hash are in `plan.json.sourceIntegration`. HEAD and all five source hashes
were stable on capture and unchanged on post-integration read. No source-worktree writes.
Local snapshot/patch: `.local/integration-r8/source/` and `shelf.patch`.

`git apply --3way --index .local/integration-r8/shelf.patch` applied the three tracked
files cleanly. The browser gate and reference handoff were copied from the captured
snapshot. Component, tests, gate and source handoff match their recorded source hashes.
For the shared stylesheet, exact text comparison confirms the target equals the full
r7 stylesheet with only its old shelf-result block replaced by the incoming block.
The earlier header/tabs/CTA/icons/action-row and dialog repairs are retained.
The imported [source handoff](shelf-result-reference.md) preserves its historical
port 5176 and 205-test result; the combined preview/results below supersede those.

Files changed for implementation:

- `apps/store-pwa/src/store-shelf-life.tsx`: semantic date, labeled facts, state badge, overdue copy, milestone labels/positions, fresh business date at submit.
- `apps/store-pwa/src/store-app.css`: white rounded result card, 28px primary date, 18px facts, red overdue box and compact timeline using existing tokens.
- `apps/store-pwa/src/store-shelf-life.test.tsx`: 12 added cases for states/boundaries, short life, before NSX, edit/reset and midnight resubmit.
- `e2e/scripts/check-shelf-result.cjs`: imported targeted DOM/interaction/screenshot gate.
- Cycle evidence/plan plus `docs/CURRENT_STATE.md` and `docs/NEXT.md` record the combined handoff. `plan-r7.json` preserves the prior acceptance record.

No domain/API/date formula, shared UI, assets, root config/dependency or Figma changes.
Two bounded reviews: source patch/provenance/CSS preservation, then combined browser
and screenshot review. No additional implementation repair was needed after integration.

## Verification

Commands run in the target worktree; browser commands use
`STORE_APP_URL=http://127.0.0.1:5177` and headless Chromium. Logs are local under
`.local/integration-r8/`. No broad pixel snapshots; all data/clock/workbooks are synthetic.

| Command | Combined-tree result |
| --- | --- |
| `npm test --workspace @coopfood-kph/store-pwa -- src/store-shelf-life.test.tsx src/store-app.test.tsx src/use-dialog-return-focus.test.tsx` | PASS, 3 files / 25 tests |
| `npm run verify` | PASS docs, Contract Lock (23 resources / 15 API fixtures), generated-client drift, workspace TypeScript, **217 tests** (Admin 14, Store PWA 175 / 22 files, API 2, rules 19, UI 7), production builds |
| `node e2e/scripts/check-shelf-result.cjs` | PASS 390×844 and 1440×1024: 11 result scenarios each, invalid/reset, unknown NSX, quick utility; extra 375px quick geometry. No label overlap, horizontal overflow or runtime errors; card below 300px, date ≤28px, red overdue label/count, timeline scrollable |
| `node e2e/scripts/check-store-sheet-focus.cjs` | PASS both required viewports: opener focus, nested Escape, Account/quick draft, route lifetime, query coherence, icon/CTA geometry and expanded hit areas |
| `node e2e/scripts/check-figma-mobile.cjs` | PASS both viewports: navigation/filter/selection, Excel, lookup states, scanner fallback, image viewer, review/edit/send, shelf rule, DATE actions, overflow/assets |
| `node e2e/scripts/check-store-qa-repairs.cjs` | PASS both viewports: isolated selection/review/export, SKU/UPC, DATE session/count/guards, quick route/IDs, metadata and touch areas |
| `node e2e/scripts/check-kph-calendar-icons.cjs` | PASS both viewports: both KPH kinds, icon source/stroke/geometry, read-only detected date, picker select/Escape/focus |
| `node e2e/scripts/check-figma-responsive.cjs` | PASS 390×844, 599×900, 600×900, 899×900, 900×900, 1440×900 and 1440×1024: shell/assets, scanner fallback, quick keyboard, shelf rule, no horizontal page overflow |
| `git diff --check` / `git diff --cached --check` | PASS |

Visual inspection covered integrated reference cards at 390/1440, expired and
short-life cards at 390, plus the quick panel at both sizes. Screenshots are local
`.local/shelf-result/*.png`; existing browser gates retain their local screenshot
locations. Shared-CSS preservation was checked by exact text comparison as above.
Verification precedes the application candidate commit; subsequent commits only
finalize this cycle's ledger. Delivery consistency is checked after recording the candidate.

## Decisions and limits

Milestones are evenly spaced for readable labels; today interpolates within each
interval. This is a milestone diagram, not a scaled time axis. Short life combines
Hạn lùi / HSD; outside dates anchor today at an endpoint with explicit range copy.
EXPIRED retains HSD as the primary date; other states show withdrawal date.
The 37/18 example uses synthetic 30/09/2026. Runtime uses the current Vietnam
business date and recomputes status when submitting again after midnight.

Technical readiness covers the synthetic mock and existing build. Existing schema
format notices and Excel mixed-import/chunk-size warnings remain. Owner visual/workflow
acceptance is pending; real camera/backend/device behavior is outside this integration.
Mock state resets on reload. No main merge, push, deployment or Pages cutover.
See [owner handoff](acceptance-handoff-r8.md).
