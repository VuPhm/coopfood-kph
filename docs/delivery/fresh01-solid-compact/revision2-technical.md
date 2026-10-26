# FRESH01 revision2 — Home depth, gradients and bright fields

26/10/2026. Runtime `40b238fe988734711538a122a9fef15cf1613fe5`.
Preview <http://127.0.0.1:4364/#home> / <http://127.0.0.1:4364/#kph>.
Technical PASS; integrated visual owner acceptance pending. Same branch/worktree,
root sole writer. Revision1 source1c5182c/evidence and plan are archived in
revision1-technical.md / revision1-plan.json. Frozen4362 remains for comparison.

## Owner direction and implementation

Owner after4362 asks to retain the old Home reference, intensify its effects,
add decorative gradients with limited cost, strongly reference iOS27 and fix
fields looking disabled. This supersedes white-only Home/no-gradient paint,
while retaining the single compact UI, structure and all business interactions.

- `store-home.css`: reviewed actual c5a440b Home source and its390 screenshot.
  Restored mint/pink/blue/peach launcher identity. Round44px icons have bounded
  radial/linear shading, highlight edges and depth; cards retain airy spacing,
  existing click handlers and responsive2/4columns. Shared size roles remain.
- `store-material.css`, `store-button-system.css`, `store-header.css`: static
  light gradients on functional surfaces/nav/hero/actions; white content and
  business labels/timelines stay readable. Colored KPH CTA has its own darker
  ramp rather than a white wash over white text. Header text is white and the
  store context uses a darker tint to retain contrast at every gradient stop.
- `store-form-soft.css`, `store-kph-fresh.css`: editable fields white with a
  clearer resting edge; hover/focus retain white, readonly#f9fbfa/full opacity,
  disabled#e4ece7 and error#fef3f2. Removed the old readonly !important override
  and circular canvas↔field token mapping. No field outer shadow; active inputs
  remain16px and grow with text. Native semantics/labels/validation unchanged.
- `check-kph-colors.cjs` now composes a conservative gradient-stop envelope for
  every linear/radial layer and alpha combination; all possible sampled stop
  combinations must pass, rather than skipping complex backgrounds. This is
  stricter than position-only single-linear sampling and is scoped evidence,
  not a full WCAG certification or pixel-perfect gradient raster model.
- `check-store-solid.cjs` adopts the explicitly requested four-tone Home instead
  of its superseded white-card assertion. New `check-store-material.cjs` checks
  field states, decoration constraints, CSS payload and diagnostic scrolling.
  Product/current-state docs record this refinement. No new runtime JS, DOM
  structure, library, dependency, image asset, mode, API or domain change.

## Official references and web interpretation

Read [Apple iOS27](https://www.apple.com/os/ios/), especially design refinements
and legibility, plus official [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
and [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields).
HIG Markdown was read from Apple's corresponding .md endpoints because the web
reader does not support text/markdown. Files remain outside the repository.

The material reference separates floating functional controls from content and
encourages selective use. Text field guidance emphasizes clear purpose, labels
and spacing. We interpret those cues as static highlights/shading, dimensional
icons, clear fields and readable state changes. Exact native Liquid Glass
refraction is not claimed. Native appearance controls are not added to this app.

## Actual verification

Commands run in this worktree. All browser commands use
`STORE_PREVIEW_URL=http://127.0.0.1:4364`; synthetic fixtures only. Raw ignored
logs/screenshots/JSON in `.local/fresh01/r2/`.

| Command / artifact | Result |
| --- | --- |
| `VITEST_MAX_WORKERS=2 npm run verify` → verify.log | exit0,347tests (Store294/Admin16/API2/rules19/UI16), docs/contracts/generated API/types/build/PWA |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/fresh01/r2/build --emptyOutDir` → build-final.log | exit0,117precache, exact final CSS source40b238f |
| `node e2e/scripts/check-store-solid.cjs`, STORE_SOLID_OUTPUT=.local/fresh01/r2/solid | exit0,7routes×5viewports; Home identity/gradients, shared palette/contrast, tags, focus, print, no mode/overflow and stale-key independence |
| `node e2e/scripts/check-store-material.cjs`, STORE_MATERIAL_OUTPUT=.local/fresh01/r2/material | exit0,390/1440/320: Home static light, no backdrop blur/animation/will-change on decoration, white editable/hover/focus, actual readonly, native-disabled style probe, real quantity0 validation/error/focus and screenshots |
| `node e2e/scripts/check-store-reflow.cjs`, STORE_REFLOW_OUTPUT=.local/fresh01/r2/reflow | exit0,Home/reports/shelf×390/1440/320;150% and200%, no button/text/page clipping |
| `node e2e/scripts/check-store-actions.cjs`, STORE_ACTIONS_OUTPUT=.local/fresh01/r2/actions | exit0,390/1440; DATE reminder1/7, TPCN/TPTS validation/photo/review/save, KPH handoff, form150/200, report Excel/PDF7rows/history and shelf rule |
| `node e2e/scripts/check-store-scrollbars.cjs`, STORE_SCROLLBARS_OUTPUT=.local/fresh01/r2/scrollbars | exit0,7routes×5viewports/dialogs; native wheel/thumb drag, locks/focus/overflow |
| `npm run check:docs`, `git diff --check` | pass |

347unit/contracts/build evidence precedes the final CSS-only CTA/header contrast
repair. Runtime TS/domain/output and unit sources are identical; unit coverage
is reused. Final mock build, full solid/contrast and material gates run after
those changes. Actions/scrollbar/reflow evidence covers unchanged geometry and
business semantics; the last header repair changes text/background color only.
Final documentation/ledger commits contain no runtime change after40b238f.

Root inspected old Home and current390 Home/form plus viewport matrices. Review
is bounded2/2; no outstanding technical blocker or new unsolicited audit.
Initial contrast checker rejected layered radial paint as unsupported; the
checker was extended with conservative composition. Subsequent checks found
mint header copy at4.351:1 and the bright store pill at4.310:1. Both were fixed
with readable text/tint; thresholds were preserved. Failed diagnostic logs
are retained separately. These were not waived as aesthetic exceptions.

## Performance boundary

Compare gzip sums of all built CSS files to frozen revision1:
56476bytes →57103bytes, **+627bytes gzip** (budget<4096). No production JS logic,
asset or dependency added. Gradient layers are static, confined to finite
surfaces; no new backdrop/filter blur, continuous animation or persistent
will-change. Main content/fields remain opaque and scroll ownership is unchanged.

A diagnostic390 KPH scroll with4×CPU throttling,45rAF samples and normal motion
preference recorded median16.6ms/p9517.8ms. No infinite running animation was
present after settling. This is one headless/emulated scenario, not a claim
about frame rate or energy use on physical iPhones/Safari. Payload/paint design
bounds are stronger evidence here than treating that timing as a device benchmark.

## Handoff

At4364 compare Home with its old reference; open KPH/DATE form and type quantity/
dates/notes to assess the brighter active fields and state distinction. The
next small step is owner review of this local candidate. No main merge/push or
Cloudflare update; public demo remainsCOMPACT03r4. Mock session/reset and report
history limits remain as before. Technical PASS is separate from visual approval.
