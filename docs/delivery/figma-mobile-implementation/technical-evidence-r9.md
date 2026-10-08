# Technical evidence — shelf input repair revision 9

09/10/2026. Owner “tiếp” continues the authorized QA/repair after the r8 integration.
Same cycle/branch `store-app/qa-20261009-sheet-focus`, worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`, sole writer /root.
Base `8a3942d9130440a0f26e0386fec343b7feb2887b`; candidate is in [plan](plan.json).
Prior acceptance record is preserved in `plan-r8.json`; owner acceptance remains pending.

## Reproduction and repair

Playwright reproduced these three defects at 390×844 and 1440×1024 before editing.
Audit JSON/screenshots are local under `.local/ui-r9/`.

| Defect | Result after repair |
| --- | --- |
| Enter 2 months before NSX: the month value disappears, expiry stays empty and submit errors | Explicit duration source survives an empty/incomplete anchor; valid anchor entry/edit computes the dependent date in both known/unknown modes. Clearing an anchor clears its derived date but retains duration. |
| Paste -2 / 1.5 / 10000 days: input becomes 2 / 15 / 1000 and computes a different expiry | Preserve raw input. Positive safe whole-number validation rejects signs/decimals/exponents/zero; a valid 10000-day duration stays 10000 and computes 15/02/2054 from NSX 01/10/2026. |
| Invalid date submit leaves focus on the button, with no invalid/description association on the field | Associate an error ID using the form prefix, set aria-invalid/description on the relevant field, and focus after commit so the focus event sees those attributes. Editing/reset clears the error association. |

Files changed:

- `apps/store-pwa/src/store-shelf-life.tsx`: local duration source, dependent-date synchronization, raw-number validation and field-associated error/focus. Reuse existing domain date functions and CalendarInput validation props.
- `apps/store-pwa/src/store-shelf-life.test.tsx`: 12 new cases, plus independent error association coverage for coexisting utilities. Covers both entry orders/modes, edit/clear, bad raw values/recovery, valid five-digit days, month-end/mode/explicit-date override, one-day HSD > NSX rejection, error focus and attribute timing.
- `e2e/scripts/check-shelf-input.cjs`: main/quick browser gate, including actual focus-event attribute checks, state recovery, month-end and Account/quick draft/Escape regression.
- Cycle plan/archive/implementation/evidence/handoff and `docs/CURRENT_STATE.md` / `docs/NEXT.md` record this candidate.

Two bounded reviews completed: reproduced defects and focused implementation tests;
then integrated DOM/interaction/screenshots. The second review moved error focus
from the event handler to after DOM commit, with regression evidence for the focus
event's invalid/description attributes. Final checks were rerun after that change.

## Verification

Final code: `npm run verify` PASS docs, Contract Lock (23 resources / 15 API fixtures),
generated client drift, all workspace TypeScript, **229 tests** (Admin 14, Store PWA
187 / 22 files including 29 shelf cases, API 2, rules 19, UI 7) and production builds.
Initial focused shelf run passed 26 cases; the final whole-workspace run includes
one-day duration rejection and focus-event timing added during review.

All browser commands use `STORE_APP_URL=http://127.0.0.1:5177`, headless Chromium;
logs are `.local/ui-r9/`. No broad pixel snapshots or real operational data.

| Command | Result on final code |
| --- | --- |
| `node e2e/scripts/check-shelf-input.cjs` | PASS 390×844 / 1440×1024, both main and quick forms: duration-first days/months and known/unknown anchors, clear/edit, raw invalid values and recovery, five-digit duration, leap/month-end/mode/override, field/error ID/focus timing, result recovery, Account keeps invalid draft and Escape returns to FAB |
| `node e2e/scripts/check-shelf-result.cjs` | PASS both required viewports, 11 state/boundary scenarios each, reset/invalid/unknown NSX, quick and extra 375px geometry; no label overlap/page overflow/runtime errors |
| `node e2e/scripts/check-store-sheet-focus.cjs` | PASS both viewports: focus/nested Escape/draft/route/query, geometry/icons and expanded hit areas |
| `node e2e/scripts/check-figma-mobile.cjs` | PASS both viewports: navigation/filter/selection/Excel, lookup states, scanner/viewer/review/edit/send, shelf and DATE actions, assets/overflow |
| `node e2e/scripts/check-figma-responsive.cjs` | PASS 390×844, 599×900, 600×900, 899×900, 900×900, 1440×900 and 1440×1024: shell/assets, scanner fallback, quick keyboard and shelf rule, no horizontal overflow |
| `git diff --check`, docs check | PASS |

Screenshot review covered invalid day/month fields on main/quick at both required
sizes, plus successful recovery and retained reference card. Invalid fields use the
existing semantic styles and visible focus ring; error copy fits. Local screenshot
files: `.local/ui-r9/invalid-*.png`, `recovered-*.png`, `.local/shelf-result/*.png`.

Exact text comparison against the r8 base confirms the result section and timeline
implementation are unchanged. `git diff --exit-code 8a3942d --` the shared CSS,
CalendarInput, rule/UI packages, contracts/generated client passes. No asset,
root configuration/dependency, API, domain, Pilot or Figma changes. Untouched KPH
calendar and detailed QA-repair evidence from [r8](technical-evidence-r8.md) remains
historical reusable coverage: their source/CSS/assets did not change; the current
aggregate/focus gates additionally verify their existing interactions on this tree.
Those two independent scripts were not rerun or claimed as new r9 gate executions.

## Decisions and boundaries

The last explicitly edited duration drives derivation until a manual expiry edit
in known-NSX mode selects the entered date pair. A mode switch changes the anchor
and recomputes using the existing day/month functions. Month-end arithmetic can
clamp dates and is not assumed invertible; the visible derived day count stays in
sync. HSD must still be strictly after NSX, including a one-day duration. Existing
20%/40% rounding, inclusive days and Vietnam business-date rules stay unchanged.

Preview remains synthetic/session-only; reload resets fixtures. Existing schema
format notices and mixed Excel import/chunk-size build warnings remain. No owner
sign-off, backend/API/real-camera/device claim, main merge, push, deploy or Pages
cutover. Original source worktree was not edited. Verification precedes the candidate
commit; subsequent commits only finalize this cycle's ledger.
See [owner handoff](acceptance-handoff-r9.md).
