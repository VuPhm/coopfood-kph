# One bounded CSS/structure review — COMPACT03 revision5

Reviewer: /root/compact_css_review_r5, read-only runtime/source scope. Reviewed
baseline accccfe (runtime4352 / df369271); root owns all implementation changes.
No tracked file edited by reviewer. Supporting probe files are ignored artifacts.

## Consolidated findings (max3)

1. **P2 — The setting's own layout changes while being operated.**
   `store-compact-surfaces.css:71–87` changes account body padding/gap, store
   section padding/icon size, switch min-height/padding and action sizes as the
   preference flips. `store-fresh-surfaces.css:40–52` has a second comfortable-only
   geometry owner. `store-app.css:363` centers the desktop dialog by its changing
   height; mobile is bottom-anchored by340. On real home→account→toggle,390×844
   sheet top shifts+68px/height−68px and switch top+34px/height−10px. At1440×1024
   sheet top+43px/height−86px and switch top+9px/height−28px. At844×390 the sheet
   box stays capped but switch top−33px/height−10px. Evidence account-jump.json.
   This movement is different from expected density compression behind the
   settings overlay. Minimal fix: one density-independent geometry recipe for
   account/controller, preserve checked/focus paint and inner scrolling.

2. **P2 — DATE input's intended auto-height loses on specificity.**
   In `store-density.css:51`, `:is(.store-date-search, .store-date-scan,
   .store-date-search-form > .store-button)` inherits the max specificity of the
   form/button branch. Its fixedheight44 beats the later auto/min-height input
   declaration at161–165. Baseline Compact DATE search still measures44px at
   font32/line48, so it cannot grow with enlarged text as the later rule intends.
   Minimal fix: remove the search-input branch from51, retaining scan/button44;
   let the later auto/min44 rule own the input height. Recheck normal16px geometry
   and200%text alignment. Other earlier inputheight declarations47/57/70/81 are
   dead against same-specificity laterauto; delete only their height properties,
   retaining needed fonts/padding. `top:13px` at52 is likewise superseded by167.
   The controlled font probe records computed values in date-search-height.json;
   screenshot is supporting evidence, not a claim about a physical device.

3. **P3 — DATE flat filter recipe has two owners.**
   `store-density.css:68,156–159` and
   `store-date-notification-surfaces.css:28–32` both own DATE section padding,
   gap and flattening. The latter is more specific and imported later. This is
   maintenance redundancy, not a second observed jump. Safe narrow cleanup is
   to retain the DATE file as owner and remove only `.store-date-filter-section`
   arms from the generic68/156 groups (keep DATE body gap rule67). Generic
   specificity stays unchanged because its report-sheet branch is still the
   max-specificity member. KPH/report recipes stay in density.css. Alternatively
   defer this cleanup if preserving a minimal bugfix; no broad CSS rewrite needed.

## Review boundary

No business semantics, data/API, UI package, Home brand, chart/timeline or print
change suggested. Underlying content can legitimately compress when a density
preference changes; the controller/dialog/focus and reading location must remain
stable. Source review alone does not prove scroll anchoring for every screen.
Root independently investigates page scroll/focus and runs final integrated QA.
One consolidated review round is complete; no new audit families or second review
round were opened.
