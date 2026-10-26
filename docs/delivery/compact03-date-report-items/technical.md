# COMPACT03 revision4 — technical PASS, owner pending

Date26/10/2026. Candidate `9e5af0d649b31298d1eceb995c64fa4dc2732731`.
Runtime/source tested `df369271bcc91a27bf61c1a458bca336aa0f9f96`.
The only candidate delta is CURRENT_STATE/NEXT status text; app/test source and
production4352 are byte-identical. Final docs check passes after that delta.
Frozen4350 is revision2 baseline2a3b574; no main integration/push/deploy/Pages.

## Scope / files

Owner continued the interrupted agent loop for default Co.op Fresh too, then
explicitly added DATE management, notifications and analogous functional flows.
No prior COMPACT03 acceptance inferred. Previous revision evidence remains in
revision2-technical.md and revision3-plan.json; new gates reference revision4.

- `apps/store-pwa/src/store-fresh-foundations.css`: both densities input16/24,
  captions12/18, calendar launchers44px; KPH filter dates reflow at narrow widths.
- `store-fresh-surfaces.css` in the same directory: comfortable KPH detail wraps
  label/value at200% text, section17px; softer secondary DATE/report processing,
  report facts without nested fill and account/settings soft grouping.
- `store-date-notification-surfaces.css`: notifications use DATE-like title,
  identifier, full-width state/reminder and24px percent; Compact DATE filter,
  detail and reminder become flat sections with consistent type/actions.
  Timeline holder retains its box width/height. Native disclosure and exact-lot
  navigation stay intact; no invented notification filters or unread state.
- `feature-loading.css`: neutral paint on actual KPH label/icon/marker markup,
  both densities; intrinsic boxes and aria lifecycle preserved.
- `store-app-frame.tsx`: imports the three Store-local CSS recipes.
- CURRENT_STATE/NEXT, product STORE_APP_DENSITY/STORE_APP_SURFACE_STYLE and this
  delivery folder record scope, decisions, workflow and verification.

No JSX/component business changes, API/auth/store-scope/data changes, packages/ui,
root config/lock/dependencies, Home composition or chart/timeline color changes.

## Agent loop / review

Reviewed base2a3b574, isolated worktrees, one writer each. Foundations agent failed
service capacity before writing; root completed its scope and verified it.
Interrupted loading CSS was recovered and reviewed by root. Agent commits:
foundations4046c24 (integrated44881bd), surfaces5461c4d (8aa51e3), DATE d7e86b3
(645b546). Scope checks PASS before each integration. Root integrates shared files.

One integrated review round, two independent reviewers, no blockers:
- `/root/surfaces_r4` reviews nonself foundations/loading/DATE/notifications.
- `/root/date_notifications_r4` reviews nonself Fresh surfaces/foundations.
Root additionally inspects source, actual notification screenshot and loading
paint, and runs integrated behavior/output comparisons. No second repair pass
was needed; no broader audit was opened. Review limit remains two rounds.
Evidence `.local/compact03/r4/review-{surfaces,date}/findings.md`.

## Commands / results

All commands run in this task worktree. Artifacts/logs are ignored under
`.local/compact03/r4/`; synthetic fixtures only, no operating photos/workbooks.

- `VITEST_MAX_WORKERS=2 npm run verify`: exit0,346tests (Store293/Admin16/API2/
  rules19/UI16), docs/contracts/generated API/types/build/PWA. `verify.log`.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact03/r4/build --emptyOutDir`: exit0,117precache.
  `build.log`. Existing ExcelJS large-chunk warning remains.
- `STORE_PREVIEW_URL=http://127.0.0.1:4352 STORE_BASELINE_URL=http://127.0.0.1:4352
  STORE_DENSITY_OUTPUT=.local/compact03/r4/density node e2e/scripts/check-store-density.cjs`:
  exit0,390×844/1440×1024/320×844/900×650/844×390, real toggle/persistence,
  malformed/denied storage, state/draft/filter/selection, portals, forced colors,
  print and form150/200%. Compact actions390/1440 pass DATE1/7day reminders,
  validation/photo/review/save TPCN/TPTS, KPH, report/history/Excel/PDF and shelf rules.
  Baseline=self deliberately tests default→toggle→restore in this new design;
  it does NOT claim historical comfortable geometry parity. `density.log`.
- `UI_URL=http://127.0.0.1:4352 UI_OUTPUT=.local/compact03/r4/secondary
  UI_WIDTHS=390,1440,320,900,844 UI_MODES=comfortable,compact
  node .local/compact03/r2/audit.cjs`: exit0,10cases, KPH detail/approve/reject,
  report personal/save/history/manage/cancel, shelf recall and account/focus.
  Targets44px, no page overflow, sampled text contrast checked. `secondary.log`.
- `UI_URL=http://127.0.0.1:4352 node .local/compact03/r4/foundations/probe.cjs`:
  exit0,6cases, actual integrated CSS (no injection), input16px/min44, filter
  dates fit usable canvas and calendar44×44. `foundations/integrated.log`.
- `UI_URL=http://127.0.0.1:4352 node .local/compact03/r4/loading.cjs`: exit0,
  delayed real KPH chunk390/1440 both modes, neutral labels/icons and loaded
  semantic color restored; aria-hidden loading list. `loading-integrated.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4352 STORE_NOTIFICATIONS_OUTPUT=...
  node .local/compact03/r4/notification-modes.cjs`, once comfortable and once
  `STORE_UI_DENSITY=compact`: exit0 both,390/1440/320, collapse/keyboard,
  exact C24-118, suppress/remind/deduplicate, date changes,150% text, contrast.
  Wrapper injects density into each page and runs the existing notification gate;
  no source test relaxed. `notifications-{comfortable,compact}.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4352 STORE_DATE_OUTPUT=.local/compact03/r4/date-actions
  node e2e/scripts/check-date-actions.cjs`: exit0 default390/1440/320, reminder1/7,
  cancel, due notifications, TPCN/TPTS prefill/photos/save/single pending record,
  resolved removed and unknown-kind choice. `date-actions.log`.
- `node .local/compact03/r4/parity.cjs`: exit0 against frozen4350,6cases
  (390/1440/320 both modes) ×6routes, full page content equal, chrome/Home outer
  metrics equal, print probes equal; DATE timeline track/holder width/height,
  computed font/colors/background equal. `parity.log`. Intentional secondary
  surface and notification geometry changes are excluded from historical parity.
- `STORE_PREVIEW_URL=http://127.0.0.1:4352 STORE_SCROLLBARS_OUTPUT=...
  node e2e/scripts/check-store-scrollbars.cjs`, default and STORE_UI_DENSITY=compact:
  exit0 both,7routes×5viewports plus dialogs, actual thumb drag, lock/restore,
  stable header and no horizontal overflow. `scrollbars-{comfortable,compact}.log`.
- `npm run check:docs` after final status text: exit0; `git diff --check`: clean.

Integrated independent reviews additionally verify actual KPH summary200% dates,
notification/reminder150% at390/1440/320 (including focused320Compact reminder
above footer), keyboard switch twice, preserved account hero and focus return.
Agent injection evidence is supporting evidence, not substituted for actual build.

## Owner scenario / limits

Preview <http://127.0.0.1:4352/#date> and <http://127.0.0.1:4352/#notifications>.
Turn on Chế độ gọn in Tài khoản → Cài đặt, compare both densities; open/filter a
lot, choose Ghi nhận→1day/1week, and navigate from a notification to its exact lot.
Owner acceptance is pending; technical PASS grants no merge/deploy authority.

Browser mock/memory-only, not backend, Safari/physical-device or production proof.
Reminder/DATE source does not persist across reload or push while closed. No new
platform/dependency/API/data behavior. Production4352 session25313; frozen4350
session69302. Main remains f77034d, clean; remote refs not refreshed in this slice.
