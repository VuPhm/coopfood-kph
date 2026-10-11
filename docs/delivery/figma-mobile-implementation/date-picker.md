# Themed date picker and keyboard corrections — 06/10/2026

Owner requested restoring the previous picker theme and fixing year corruption
when editing day/month manually, preserving shelf-life lookup semantics. This
supersedes the native-picker experiment earlier on 06/10/2026.

Same stopped implementation candidate: branch
`store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`. Existing dirty work remains preserved.

## Cause and fix

The old formatter stripped all separators and repartitioned the digits on every
keystroke. Deleting a digit from `12/10/2026` produced `11/02/026`; a regression
test reproduced that failure before the fix. Separated dates now preserve their
individual day/month/year segments, including partial/empty segments, while
compact digit entry still adds separators. Existing strict date parsing and
validation remain authoritative; incomplete dates are not converted into a
valid date or silently padded.

Removed the native input/showPicker bridge. The existing branded portal calendar
is again used on every viewport and opens only from the calendar button. Text
focus/click allows typing. Read-only detection dates remain locked. Escape is
handled at window capture before Radix's parent dialog listener, closing only
the picker and returning focus to its button; selection also restores focus.

Changed files: `calendar-input.tsx`, `calendar-input.test.tsx`,
`store-shelf-life.test.tsx`, `e2e/scripts/check-date-picker.cjs` (replaces the
native experiment script), and this record. No business-rule, API, dependency,
CSS theme, authorization, migration or Pages change.

## Verification

- `npm test --workspace @coopfood-kph/store-pwa`: PASS 131 tests / 18 files.
- `npm test --workspace @coopfood-kph/kph-rules`: PASS 19 tests / 2 files,
  including existing date/domain fixtures.
- `npm run build --workspace @coopfood-kph/store-pwa`: PASS TypeScript/build;
  existing bundle-size/ineffective dynamic import warnings remain.
- `node e2e/scripts/check-date-picker.cjs`: PASS Chromium headless at
  390×844 (touch) and 1440×1024. Real Backspace/Delete and keyboard typing
  preserve year/caret while changing day/month, including a cleared month;
  button-only opening, calendar selection, clearing, bounds and Escape verified.
- `git diff --check`: PASS.

Shelf screen regression verifies incomplete dates cannot yield a stale result,
inclusive 10-day shelf life withdraws 2 days early, editing NSX to produce 9 days
withdraws on HSD, and editing HSD's month to produce 40 days withdraws 8 days
early, preserving the year. No shelf-life implementation change was needed.

Screenshots `.local/date-picker/filter-{390,1440}.png` were visually inspected.
Native popup appearance is no longer relevant. Physical device testing and owner
visual acceptance remain pending. Preview: http://127.0.0.1:5175/.
Next small step: owner retries in-place day/month correction and lookup.

## Timeline refinement — 06/10/2026

Owner requested an today marker and proportional 0–60–80–100 timeline without
additional visible wording. `store-shelf-life.tsx` now places milestones by actual
date distance from NSX to HSD, preserving rounded business-rule dates. A triangle
marks today with an accessible label/hover title; dates outside the span clamp to
the endpoint with an outward arrow shape. Under-ten-day withdrawal/expiry share
one marker, and no warning date is invented. Existing date labels remain.
`store-app.css` replaces equal-spacing flex layout with a proportional rail.
`e2e/scripts/check-shelf-timeline.cjs` PASS at 390×844 and 1440×1024: measured
marker centers 0/60/80/100 on a 100-day axis, today 66%, coincident short-life
milestones, outside dates and overflow. Screenshots in `.local/shelf-timeline/`
visually inspected. TypeScript, all 131 Store PWA tests and diff whitespace PASS.
No rule implementation changed. Physical-device/owner acceptance still pending.
Next small step: review timeline in the same local preview.
