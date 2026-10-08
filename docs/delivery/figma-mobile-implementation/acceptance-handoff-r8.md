# Combined UI and shelf result r8 — owner preview

09/10/2026. Branch `store-app/qa-20261009-sheet-focus`; worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`. Combined candidate
`081c7117d814a53207134fddda4c9009a043f9f1` is recorded in [plan](plan.json). Preview: [Tra hạn lùi](http://127.0.0.1:5177/#shelf).

The owner-authorized shelf result snapshot is now integrated with all r7 UI repairs.
The original worktree remains unchanged. The exact five source hashes/base are in
`plan.json.sourceIntegration`; [source handoff](shelf-result-reference.md) is preserved
as historical provenance. Current verification and preview use port 5177.

## What to inspect

- Tra hạn lùi: white rounded result card, 28px primary date, two labeled 18px counts, red overdue label/count and status badge; today and milestone labels fit mobile and desktop.
- Try NSX 18/01/2026 and HSD 18/10/2026, then Làm mới/edit and submit again. Counts follow today's Vietnam date. Reference 37/18 belongs to the synthetic test date 30/09/2026.
- Short life combines Hạn lùi / HSD; expired results show HSD as the primary date. Today outside the date range anchors to an endpoint with explicit copy. Milestones are a readable diagram with equal spacing, not a scaled time axis.
- Open quick utility from KPH and submit the same dates; scroll to the timeline. Open Account and close with Escape: the utility/draft remains. A nested calendar/scanner/viewer closes its own layer and returns focus to its opener.
- Prior r7 header/tabs/CTA/chevron, dark search icons, DATE desktop action row and query/route repairs remain. Existing [r7 scenarios](acceptance-handoff-r7.md) were rerun on this combined candidate.

## Technical status

[Evidence r8](technical-evidence-r8.md): 217 tests/build PASS; six Playwright browser
gates PASS at 390×844 / 1440×1024, seven responsive sizes and extra quick-panel 375px
geometry. Screenshot/DOM/interaction review found no integration conflict; source
component/tests/gate copied exactly, shared CSS preserves both scopes.

Owner visual/workflow acceptance remains pending. Preview is synthetic and memory-only;
reload resets fixtures. Existing build warnings remain; no new backend/API/real-device
verification, merge/push/deploy or Figma write in this round.

Next small step: inspect the combined card and quick utility on port 5177 and record
owner feedback against this candidate in the existing cycle.
