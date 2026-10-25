# COMPACT03 revision2 — verification in progress

Date26/10/2026; source and gate SHA are pinned in plan.json after checkpoint.
Resume checkpoint236ce91 preserves r1 items and its evidence; no acceptance
inferred. Owner explicitly authorized expanding the same task to uncovered
surfaces. One writer, same worktree, no agent dispatch.

## Scope and two bounded passes

Pass1 source/screenshot audit at390×844/1440×1024 identified four families:
KPH detail, report menu/personal rows/history, shelf history, account/settings.
Before artifacts: `.local/compact03/r2/baseline/`; comfortable baseline:
`.local/compact03/r2/baseline-comfortable/`. Both use frozen r1 build4348.

Pass1 implemented Store-local `store-compact-surfaces.css` and one frame import.
No component tree, effect, state, handler, API, package/dependency/config changes.
Flat summary/store/settings rows; report functional rows72px with36px faces;
shelf rows flat and captions12px. Primary meanings, dates, snapshots, controls
and brand/status colors retained.

One refinement pass: replace inherited48px KPH read-only row minimum with role44px;
allow label/value wrapping and a text-relative value basis. Shelf date columns
use7em minimum with auto-fit, responsive to type. No second broad audit.

Dev QA passed four families, both densities390/1440; Compact320/900/844×390.
Targeted150/200% text QA passed390/1440/320, including shelf date columns and
portal content; title/description/value content remains in DOM. Debug probe:
`.local/compact03/r2/audit.cjs`, logs/artifacts `pass1`, `narrow`, `reflow`.

## Final evidence

Production and integrated gate results are filled after verification.
Preview4350; dev4349; frozen baseline4348. Source build for r1 was preserved
when its preview process was restored after interruption; no baseline rebuild.

## Limits / deferred

No main integration/push/deploy/Pages; no FORM01 acceptance inferred. Browser
mock/fixtures only, not backend authority, Safari/OS or physical-device proof.
Keep accepted Home/header/navigation, charts/timeline and photo evidence outside
this pass. Default comfortable and print/output must retain their recipes.
Optional areas outside four families are deferred; do not keep auditing without
a bounded scope revision. Owner acceptance for integrated r2 remains pending.

## Native scrollbar gate on the resumed host

The original gate assumed native bars always reserve positive layout width.
At1440×1024 the current MacIntel Chromium reports bar0 on all seven routes
while document range remains positive, identically on baseline4348 and4350.
Disabling overlay-related flags did not change this host behavior. Initial
logs `scrollbars.log` and `scrollbars-overlay.log` are retained.

A wheel event reveals the auto-hiding thumb. The gate now accepts0–12px
reserved width while still requiring computed thin native scrollbars and all
existing page/body bounds, scroll-lock, header stability and drag checks. The
drag assertion is stronger: scrollTop must advance beyond its position after
the activation wheel, so wheel scrolling alone cannot pass. An optional
STORE_UI_DENSITY=compact runs the same gate against the new recipes.

The equivalent local diagnostic passed all five viewports before adopting
this validation-only change (`scrollbars-activated.log`). No app styling or OS
preferences were changed to make it pass. Runtime remains source767088a; the
final candidate also includes this test maintenance and evidence ledger.
