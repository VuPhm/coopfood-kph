# Combined UI and shelf result — revision 8

Owner request 09/10/2026: “gộp với mục này”, referencing the shelf result follow-up. Resume the existing cycle and target `store-app/qa-20261009-sheet-focus`; sole writer /root. The r7 checkpoint is in plan.json, as are exact source hashes and its uncommitted source base `b1c772f`.

Import only the three tracked shelf CSS/component/test changes plus the source browser gate and reference handoff. The source snapshot is captured locally before applying a three-way patch; do not write/commit/reset the original worktree. Resolve shared CSS by retaining all r7 geometry/focus/icon changes and the incoming shelf-specific rules. Do not change date/domain rules, API, dependencies, shared UI, or Figma.

Two bounded integration reviews: inspect patch/provenance and combined CSS; then check the combined browser workflows/screenshots. Run shelf tests and result gate first, then npm run verify plus r7 targeted/aggregate/QA/calendar/responsive gates on port 5177. Validate the result states, dates, midnight resubmit, same shelf UI in the quick utility and r7 nested Escape/draft behavior. Source clock 30/09/2026 is only a synthetic scenario; preview uses the current business date. No new pixel snapshots or design audit.

Record the combined candidate, source provenance and a runnable owner handoff. Technical readiness does not imply owner acceptance, main merge, push or deploy.
