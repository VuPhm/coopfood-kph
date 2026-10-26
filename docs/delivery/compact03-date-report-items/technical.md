# COMPACT03 revision5 — one UI/CSS review, technical PASS

Date26/10/2026. Candidate `ef7c4f0247c6f4eba3b3402d7046ad7f506df3e3`.
Runtime/test source `fa22bc1`; candidate only adds CURRENT_STATE/NEXT status text.
Preview <http://127.0.0.1:4354/#home>, dev4353, frozen4352 before fix.
Cloudflare remains revision4 deployment72c8cc2c. No merge/push/new publication.

## Findings / decision

Owner requested exactly one structure/CSS review because Compact appears to jump.
One independent read-only reviewer plus root reproduction, one consolidated list
and one repair pass. No second broad audit. See [review](revision5-review.md).
Root is the only writer, same worktree/branch, baseaccccfe.

The account/controller movement is a real stability defect. Expected workspace
compression remains enabled. Baseline4352, pointer toggle from comfortable:

| Viewport | Sheet top delta | Sheet height delta | Switch top delta |
| --- | ---: | ---: | ---: |
|390×844|+68px|−68px|+34px|
|1440×1024|+43px|−86px|+9px|
|320×844|+68px|−68px|+34px|
|844×390|0px|0px|−33px|

Two density-dependent account geometry owners caused that movement. Keep the
comfortable Fresh account recipe shared in either mode, including inner scroll.
The setting should not resize itself underneath a pointer. Checked/focus paint
and underlying workspace composition still respond immediately.

A second confirmed CSS defect: DATE search fixedheight44 inside a high-specificity
`:is()` defeated the intended auto-height rule; at32pxfont/48pxline it still
measured44px. Remove only that input branch, retain44px scan/action, center those
controls beside a growing input. Normal DATE input remains44px;200% text now66px.

## Changed files / CSS ownership

- `apps/store-pwa/src/store-density.css`: owns shared account recipe and one
  auto/min44 text input rule. Remove obsolete fixed heights/top13 and duplicate
  DATE filter arms. Retain needed font roles and scan/action sizes.
- `store-compact-surfaces.css` / `store-fresh-surfaces.css` in the same directory:
  remove account geometry rules; consumer sheets no longer reshape the controller.
- DATE filter section recipe remains in `store-date-notification-surfaces.css`,
  generic density owns KPH/report. Its source needs no new override.
- `e2e/scripts/check-store-density-stability.cjs`: meaningful browser regression:
  same-coordinate repeated pointer clicks, keyboard toggles, bounds/focus/scroll
  and DATE input text enlargement. It fails on the old build (68px movement).
- CURRENT_STATE/NEXT, product STORE_APP_DENSITY and this delivery folder record
  the revised contract, one review and verification.

No JS runtime/DOM, preference semantics, business/API/auth/data, shared UI,
dependency/config, Home/chrome, photos/chart/timeline or print rule changes.
No blanket stylesheet/layer rewrite; existing base+feature+density cascade remains.

## Verification

All following logs/artifacts live under ignored `.local/compact03/r5/`.
All use synthetic mock fixtures, no production/operational data.

- Baseline `.local/compact03/r5/toggle.cjs` measured16cases, four routes ×four
  viewports; before.log and before/results.json. Reviewer independently reproduced
  the same shift. New tracked stability gate on4352 fails exit1 at68px sheetdelta,
  expected≤1px: regression-before.log. Failure is deliberately retained evidence.
- `VITEST_MAX_WORKERS=2 npm run verify`: exit0,346tests (Store293/Admin16/API2/
  rules19/UI16), docs/contracts/API-generation/typecheck/build/PWA. verify.log.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact03/r5/build --emptyOutDir`: exit0,117precache.
  build-final.log. Existing ExcelJS large chunk warning remains; no dependency change.
- `STORE_PREVIEW_URL=http://127.0.0.1:4354
  STORE_DENSITY_STABILITY_OUTPUT=.local/compact03/r5/stability
  node e2e/scripts/check-store-density-stability.cjs`: exit0,30cases, six routes
  ×390×844/1440×1024/320×844/900×650/844×390. Same-coordinate pointer toggles
  twice and keyboard twice; sheet/hero/switch/track geometry max observed delta
  **0px**, settings body scroll unchanged, focused control/return focus correct,
  preference saved and no page overflow/errors. DATE32/48 grows to66px in all
  five viewports. stability.log and stability/results.json. Dev equivalent passes.
- `STORE_PREVIEW_URL=http://127.0.0.1:4354 STORE_BASELINE_URL=http://127.0.0.1:4352
  STORE_DENSITY_OUTPUT=.local/compact03/r5/density
  node e2e/scripts/check-store-density.cjs`: exit0, five viewports, comfortable
  normal-size parity against4352, real toggle/storage/fallback, KPH reading
  anchor/selection/collapse/draft, report settings/state, portal bounds, forced
  colors and print. Compact actions390/1440 pass DATE reminders1/7, validation,
  photos/review/save TPCN/TPTS, KPH, report/history/Excel/PDF and shelf rules;
  form150/200% reflow. density.log. This includes reading stability beyond just
  the account screenshot; no extra scroll-repair JS was necessary.
- `node .local/compact03/r5/parity.cjs`: exit0, both modes390/1440/320 ×sixroutes,
  full page content, chrome/Home outer metrics, print probes and DATE timeline
  track/holder dimensions/material equal4352. parity.log. Account Compact is the
  intentional changed scope; enlarged DATE input is the intentional growth fix.
- `STORE_UI_DENSITY=compact STORE_PREVIEW_URL=http://127.0.0.1:4354
  STORE_SCROLLBARS_OUTPUT=.local/compact03/r5/scrollbars-compact
  node e2e/scripts/check-store-scrollbars.cjs`: exit0, sevenroutes ×fiveviewports,
  dialogs/actual thumb drag/lock/restore/header/no overflow. scrollbar body remains
  accessible when taller shared account content needs scrolling. scrollbars-compact.log.
- `npm run check:docs` and `git diff --check`: pass after final status text.

Root inspected before/after screenshots; account/control fixed without hiding
content or shrinking type. No runtime changed after verifiedfa22bc1; only status
text and this evidence advance the final candidate.

## Handoff / limits

Owner scenario: open4354 Home → account, click Chế độ gọn repeatedly at the same
position, then compare actual DATE/KPH/report workspace density. The controller
stays still while the workspace reflows. Owner acceptance remains pending.

Local Chromium/mock evidence; no Safari/physical-device or real backend claim.
Cloudflare still hosts the previously authorized revision4 build; this request
was one review/repair, not an inferred new publication or main merge. Previous
source/evidence saved in revision4-plan.json / revision4-technical.md, publication
record [here](cloudflare-mockup-2026-10-26.md). Mainf77034d remains clean; remote
refs not refreshed. Preview4354 session48216, dev4353 session90426.
