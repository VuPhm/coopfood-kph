# FRESH01 revision4 — notification rhythm and card feedback

27/10/2026. Production source `699413ab76a68be5a849c557bb446f6dff7f7900`.
Preview <http://127.0.0.1:4368/#notifications>, frozen mock build in
`.local/fresh01/r4/build`;4366 keeps revision3. Technical PASS; owner acceptance
of this integrated revision pending. Owner “ổn, tiếp tục tối ưu” accepts the
revision3 visual direction and authorizes this bounded refinement. Same task,
branch/worktree and root sole writer; no new agent dispatch.

## Changes / files

- `store-notifications.css`: single owner for notification composition, flat
  grouping, native summary states, full item edge/padding and8px row gap. Keep
  phase marker, name/SKU/lot/labels and24px percentage. A18em container query
  moves percentage/chevron to a lower row when text has insufficient width.
- Remove superseded notification layout/paint declarations from
  `store-record-items.css`, `store-functional-layout.css`,
  `store-date-notification-surfaces.css`, `store-component-soft.css`.
  No new wrapper, component or runtime state.
- `store-material.css`, `store-home.css`, `store-utility-layout.css`: shared Home
  hover/pressed shadow tokens; equivalent notification/DATE/report/Home attention
  actions use stable hover/pressed/focus feedback. Selected DATE/checked KPH and
  nested KPH controls retain their own state recipes. Reports keep existing card
  geometry and template composition.
- `store-navigation.css`: stop animating foreground color across the immediate
  solid selected background change, preventing transient dim text. Background
  transition remains; no navigation/DOM/label change.
- `e2e/scripts/check-store-item-feedback.cjs`: native mouse-held press, keyboard
  focus/disclosure, exact lot open, stable boxes,8px gaps, readable nav and
  text150/200. It checks usable name width in addition to overflow and verifies
  forced colors/reduced motion. Each text sample explicitly reloads so scaling
  does not compound during same-fragment navigation.
- Product docs and CURRENT_STATE/NEXT record the new scope. Runtime TS, API,
  business rules/authorization, photos/export code, packages/ui, dependencies,
  assets and CTA/field palettes are unchanged.

## Actual checks

Commands run in this worktree. Browser common environment
`STORE_PREVIEW_URL=http://127.0.0.1:4368`; synthetic mock data only.
Raw ignored evidence lives in `.local/fresh01/r4/`, test log at
`.local/fresh01/r4-tests.log`, build log at `.local/fresh01/r4-build.log`.

| Command / output | Result |
| --- | --- |
| `VITEST_MAX_WORKERS=2 npm --workspace @coopfood-kph/store-pwa test` | exit0,41files/294tests |
| `npm --workspace @coopfood-kph/store-pwa run check` | exit0,TypeScript |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/fresh01/r4/build --emptyOutDir` | exit0,117precache |
| `node e2e/scripts/check-store-item-feedback.cjs`, STORE_FEEDBACK_OUTPUT=.local/fresh01/r4/feedback | exit0,390×844/1440×1024/320×844; stable card/summary press/hover/focus, native collapse, exact lot, gap, nav, text150/200 readable measure/contrast, system preferences |
| `node e2e/scripts/check-store-notifications.cjs`, STORE_NOTIFICATIONS_OUTPUT=.local/fresh01/r4/notifications | exit0,3widths, phase/date groups, exact-lot open, reminder/suppression/deduplication, no resolved group, contrast/text150 |
| `node e2e/scripts/check-store-solid.cjs`, STORE_SOLID_OUTPUT=.local/fresh01/r4/solid | exit0,7routes×5viewports390/1440/320/900/844landscape; palette/cards/tags/focus/print/no-mode/overflow |
| `node e2e/scripts/check-store-effects.cjs`, STORE_EFFECTS_OUTPUT=.local/fresh01/r4/effects | exit0,3widths, CTA rest/hover/focus/press/disabled, stable geometry, white fields and correct TPTS/TPCN callbacks, item/icon light |
| `node e2e/scripts/check-store-actions.cjs`, STORE_ACTIONS_OUTPUT=.local/fresh01/r4/actions | exit0,390/1440, reminder1/7, validation/photo/review/save, DATE→KPH, report Excel/PDF/history and shelf calculation |
| `node e2e/scripts/check-store-scrollbars.cjs`, STORE_SCROLLBARS_OUTPUT=.local/fresh01/r4/scrollbars | exit0,7routes×5viewports plus dialogs, native wheel/thumb drag, lock/focus restore/no horizontal overflow |
| `npm run check:docs`, `git diff --check` | pass |

Final production source699413a contains the last notification container-query
repair. Notification/feedback/solid checks were rerun against that exact build.
Effects/actions/scrollbar checks ran earlier in revision4; the only subsequent
production change was the notification18em layout query. Their CTA/form/output/
non-notification scroll coverage is reused because no corresponding source or
layout changed. The final notification/solid/feedback gates cover the changed
list at normal and enlarged text sizes.

Revision3 source342ca66 and archived technical evidence provide unaffected
Admin16/API2/rules19/UI16 unit gates, field-state/material performance constraints,
loading and Home/report/shelf large-text coverage. Those sources, callbacks and
sizes did not change; Home/report shared shadows only change paint. This round
ran294Store tests, not a fresh full347test verification. No old result is
presented as a new full verification.

## Review, cost and limits

One bounded implementation review plus a focused repair pass. Initial review
caught negative summary margin expanding group scrollWidth; the margin was
removed. Visual review found percentages squeezing names under enlarged text;
container layout now stacks the end region. Test inspection also caught a
same-fragment reset issue compounding150×200 into300%; explicit reload fixes
measurement. No threshold was reduced. Root viewed final390 and320/text200
screenshots, with native text selection cleared after mouse-down probes.

Built CSS gzip sums57538→57599bytes, **+61bytes**. No runtimeJS, asset,
dependency, blur, continuous animation or translated geometry added. Static
paint still has cost; no new device performance claim. Contrast checks include
conservative gradient-stop/alpha combinations, not a WCAG certification.
Existing bundle/schema-format warnings remain; no new error.

## Handoff

At4368 inspect notification rhythm, collapse/open groups, open a lot; compare
card hover/press in DATE and reports, and the selected mobile navigation label.
Owner visual acceptance is the next small step. Stop further unsolicited audit.
Main remainsf77034d; no merge/push/Cloudflare update (public stillCOMPACT03r4).
Mock state remains memory-only; reload resets operating data. Safari/real-device
use and production/backend behavior are outside this browser-mock evidence.
