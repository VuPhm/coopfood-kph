# COMPACT03 revision2 — technical PASS, owner pending

Date26/10/2026; candidate`24484813695d693cea6ae344cc9a041ce577aaed`.
Runtime recipe checkpoint767088a; final candidate adds native-bar gate9d16c09
and the isolated16px desktop report-column gutter fix2448481.
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

All required technical gates PASS. Local fixture/mock evidence, not remote CI.

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS346tests (Store293/Admin16/API2/
  rules19/UI16), docs/contracts/generated API/types/build/PWA. `r2/verify.log`.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build --
  --outDir ../../.local/compact03/r2/build --emptyOutDir`: PASS117precache.
  Final build includes the gutter fix; `r2/build-final.log`. ExcelJS large-chunk
  warning remains baseline. No dependency or lock changes.
- `UI_URL=http://127.0.0.1:4350 UI_OUTPUT=.local/compact03/r2/production
  UI_WIDTHS=390,1440,320,900,844 UI_MODES=comfortable,compact
  node .local/compact03/r2/audit.cjs`: PASS10cases across five widths and both
  densities. Real UI saves/opens a report and personal template, manages/cancels
  template dialog with focus return, recalls shelf history without duplicate,
  approves/rejects then restores synthetic KPH status, opens/closes account.
  Target44px, full content and no page overflow; sampled text contrast≥5.04:1.
- `UI_REFLOW=true` with same probe at390/1440/320: PASS150/200% targeted text,
  including KPH label/value wrap and em-based shelf columns. Dev `r2/reflow.log`;
  final desktop report-gutter recheck `r2/final-text1440.log`.
- Final gutter/frame check at390/900/1440: PASS stacked layouts and actual16px
  between coequal desktop choices; final report workflow probe
  `r2/final-report-check.log`. Final comfortable probe at390/1440 and
  `node .local/compact03/r2/check-parity.cjs`: PASS all six probe roots, all
  field/row text and type, geometry within1px. `r2/parity.log`. No broad pixel
  snapshots. Full Compact content matches baseline too.
- `STORE_PREVIEW_URL=http://127.0.0.1:4350 STORE_BASELINE_URL=http://127.0.0.1:4348
  STORE_DENSITY_OUTPUT=.local/compact03/r2/density node e2e/scripts/check-store-density.cjs`:
  PASS5viewport390×844/1440×1024/320×844/900×650/844×390; real toggle, persistence,
  malformed/denied storage, anchor/query/selection/collapse/draft, portals,
  comfortable/print parity and form text150/200. Actions390/1440 include DATE
  reminders1/7, TPCN/TPTS photo/review/save, report/history/Excel/PDF and shelf
  rules. `r2/density.log`.
- `STORE_PREVIEW_URL=http://127.0.0.1:4350 STORE_SCROLLBARS_OUTPUT=...
  node e2e/scripts/check-store-scrollbars.cjs`, once default and once with
  `STORE_UI_DENSITY=compact`: PASS7routes×5viewport in both densities plus
  dialogs, actual thumb drag, page lock/restore, stable headers and no horizontal
  overflow. `r2/scrollbars-comfortable.log`, `r2/scrollbars-compact.log`.

All artifacts under ignored `.local/compact03/r2/`. The fixture clock is6Oct2026
for deterministic record/history content; all values are synthetic. No operating
workbook/photos or external messages.

### Final-source evidence reuse

Verify, five-width audit, reflow and density suite ran on exact app source767088a.
9d16c09 changes only test/ledger. 2448481 changes only report-list column-gap
to16px, preserving stacked mobile rows and the app's other recipes. The final
mock build, report workflows390/900/1440, horizontal-gutter check, full default
parity390/1440 and desktop text150/200 run after that fix. Unit/domain/workflow,
print/export and portal thumb evidence is reused because that sole layout rule
is scoped to Compact report menu/personal rows, absent from composer/documents,
account, KPH, shelf, print and business logic. No runtime changed after final
checks; later commits only update this ledger.
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
preferences were changed to make it pass. Runtime at that native-bar check was767088a; the final gutter-only revision
and its targeted rechecks are described above.

## Measured effects / final review

| Probe at390×844 | r1 baseline4348 | final4350 |
| --- | ---: | ---: |
| KPH read-only row |48px|44px|
| First report menu row |82px|73px|
| Report history card |106px|97px|
| Shelf history row |174px|165px|
| Account sheet |779px|703px|

At1440×1024: menu88→73px, shelf history68→65px, account779→685px.
Captions in shelf history increase11→12px rather than shrinking type. Long
values/text enlargement can grow rows; these are measured fixture examples,
not blanket compression promises. Primary Home/header/navigation and timelines
remain outside this pass.

One implementation pass, one bounded refinement (row44/wrap and safe desktop
column gap), plus validation maintenance for the resumed host. No new broad
audit after successful gates. Owner scenario: turn Compact on at4350 and view
KPH detail, report menu/personal/history, shelf history after lookup, account
settings; switch off to compare. No user acceptance inferred from this report.

Production4350 session16735; dev4349 session34467; baseline4348 session36987.
Main checked f77034d, clean, ahead47 of the unfetched remote reference; no
main write/push/deploy. No backend/Safari/physical-device claim.
