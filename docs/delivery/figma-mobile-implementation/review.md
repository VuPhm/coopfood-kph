# Figma mobile implementation — review and repair

Date: 03/10/2026. Technical review; owner visual acceptance pending.

## Ownership and scope

The implementation chat reported completion and stopped writing before this
review began. Review continues in the same worktree
`/Users/vup/Documents/coopfood-kph`, branch
`store-app/figma-mobile-implementation`, baseline
`4fab6889f6cc6a7b66d25806262329cbf88ea024`. The candidate remains the
uncommitted working tree. Earlier dirty edits were preserved. No merge,
deployment, Pages cutover, API, database or authorization changes.

Read the implementation handoff, accepted business contracts and ADRs. Figma
structured context and screenshots for KPH `21:91`, creation `203:701` and
shelf utility `21:56` were reviewed in file `aEDpXtz0IiEkPiVucqjQ3Q`.
The existing screenshot evidence was compared, then the requested flows were
rerun in Playwright after repairs. No accepted Figma frames were changed.

## Repairs

- `store-shelf-life.tsx`: invalidate the derived date when duration is edited,
  cleared or invalid, and when the expiry anchor changes in unknown-NSX mode.
  Unknown-NSX submission requires a duration and derives NSX from the current
  expiry/duration, preventing calculation with stale hidden dates. Existing
  domain functions still decide HSD validation, inclusive shelf life and
  rounding/withdrawal/warning outcomes.
- `store-kph-workspace.tsx`: type badges count the date-filtered dataset while
  remaining independent of approval/type selection, matching D01 semantics.
  Filter/tab/sort/page changes also clear the open detail state. Both date
  filter inputs now have visible associated labels. Page-local selection and
  approved-record export remain in place; this screen is a memory-only mock.
- `store-app.css`: match creation section spacing/heading and footer proportions
  more closely to Figma. Enlarge small navigation, tab, DATE status, export,
  scanner-trigger and checkbox targets, without scaling their icon assets.
  Preserve keyboard focus on hidden-radio choice labels. Touch geometry is an
  intentional implementation adjustment; desktop remains provisional.
- `store-shelf-life.test.tsx` and `store-kph-workspace.test.tsx`: five regression
  cases cover cleared duration, unknown-NSX stale input, equal dates, date badge
  counts and page-local selection reset.
- `e2e/scripts/check-figma-mobile.cjs`: verify visible static Figma asset geometry
  against root dimension metadata, capture initial creation form, and verify
  that a cleared duration cannot reuse the old result.

## Icon review

The implementation already replaced account/search/scan placeholders with
Lucide outline and retained local Feather artwork. Calendar inputs reuse the
existing CalendarDays. Their functional semantics and accessible button names
were checked; no square holder is treated as a final account/search/scan icon.
No icon dependency or alternate icon system was introduced by this review.
Visible static assets are loaded locally and checked for rendered root dimensions
in each screenshot checkpoint. Dynamic evidence is excluded from static icon
geometry checks and keeps its image containment behavior.

## Verification and limits

- `npm run verify`: PASS docs/contract checks, generated-client drift, all
  workspace TypeScript checks, **169 tests** (127 Store PWA) and production
  builds. Existing bundle-size/ineffective-dynamic-import warnings remain.
- `node e2e/scripts/check-figma-mobile.cjs`: Chromium headless, 390×844 and
  1440×1024. Navigation, filter/selection, Excel download, lookup found/miss/error,
  scanner manual fallback, evidence viewer, review/edit/send, shelf calculation,
  cleared-duration regression, DATE action, overflow and static asset geometry.
- `git diff --check`: PASS.

The first sandboxed Chromium launch failed with SIGTRAP before loading the app;
Playwright was rerun with sandbox escalation. No tests/security checks were
disabled. Earlier test-authoring failures were corrected before the final gate.

Browser evidence uses synthetic fixtures, not a backend authorization proof.
The production entry retains the existing online app unless mock mode is
explicitly enabled; backend scope/security and accepted online tests are not
rewired by this review. DATE API, full API wiring, physical camera/iPhone and
HEIC are still unverified/deferred. Figma desktop parity awaits owner designs.
Existing bundle-size warnings remain. No owner acceptance was inferred.

Next small step: owner visually reviews the mock mobile preview at
http://127.0.0.1:5175/ and the create → review → send interaction. The review
automation stops after this bounded review; API wiring is a separate outcome.
