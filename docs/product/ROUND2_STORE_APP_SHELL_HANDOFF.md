# Round 2 handoff — shared Store App shell and KPH validation slice

Status: R1-D04 handoff accepted by the owner. Round 2 has not started.
The [Store App UI DNA](STORE_APP_UI_DNA.md) gives the design direction;
[Store App contracts](STORE_APP_CONTRACTS.md) and accepted ADRs govern behavior,
scope, and data. This document defines the minimum slice to validate, not the
implementation plan for the whole Store App.

## Minimum validation surface

| Surface | Include in the representative slice |
| --- | --- |
| Shared shell | Authenticated Store App shell with KPH named as a capability. Show acting account and current store using only data that is valid now. Offer direct TPCN, TPTS, and history entry without a mandatory overview/module stop. Do not make future modules operable routes. |
| KPH creation | TPCN/TPTS entry; scan and manual lookup; distinct `FOUND`, `NOT_FOUND`, and `CATALOG_UNAVAILABLE` states and recovery; type-specific details; visibly ordered and inspectable 1–3 photo evidence; explicit review/submit boundary. Keep the familiar continuous path as the first composition to validate. |
| History decision | Filter and visible page state; selection limited to the current page with [D01 reset/count/busy semantics](HISTORY_PAGING_CONTRACT.md); review status; export eligibility and confirmation for selected in-scope records. Show both desktop comparison and mobile decision-focused compositions. |

Use the accepted KPH, scope, catalog, media, and export behavior linked from the
[contract index](STORE_APP_CONTRACTS.md). The UI must never infer authorization
from a store selector or imply a lookup miss when the catalog is unavailable.
The original and stamped online photos remain private and ordered.

## What Round 2 should validate

Review the same signed-in, create, and history tasks on a narrow phone and a
desktop viewport, with synthetic review data and real-device checks where task
behavior depends on camera, keyboard, touch, or interruption.

1. **Shell, KPH, and task-entry speed:** a returning operator can find and start
   TPCN, TPTS, and history directly while recognizing KPH as one capability of
   the Store App. Compare the steps and time to start each task with current KPH.
2. **Workflow familiarity and migration:** task names, sequence, and return paths
   let current KPH users complete the work without one-release relearning.
   Compare task steps and recovery against the current KPH path.
3. **Mobile completion:** scanning, manual fallback, field entry, photo capture,
   inspection, back navigation, and submit remain reachable and recoverable with
   one hand and the keyboard/camera active. Observe interruption and return at
   these transitions without assuming a draft-persistence policy.
4. **Account and store clarity:** the acting account and current store are
   identifiable during work and clear again before submit, review, and export.
   Only supported current/effective context may be shown; inherited-scope
   discovery needs its own accepted contract before validation for those actors.
5. **Semantic state clarity:** an operator can explain the difference between
   `FOUND`, `NOT_FOUND`, catalog unavailability, busy/error, and review or export
   eligibility, and identify the next safe action without relying on color.
6. **Photo evidence confidence:** an operator can inspect the 1–3 photos, explain
   their order before submit and review, and distinguish displayed evidence from
   audit truth.
7. **History across viewports:** desktop supports comparison; mobile surfaces
   decision-critical facts and returns to the same filter/page after detail.
   An operator can explain what is selected on the current page and what will be
   reviewed or exported before confirming.

When implementation begins in a separately authorized Round 2 task, verify the
business invariants with the existing contract/backend/browser checks alongside
the viewport and task review. A synthetic comparison board alone cannot prove
operator performance, device behavior, or accessibility.

## Dependencies and limits

- External user guidance/training material is pending evidence. Record it when
  supplied and use it to assess migration cost; its contents are not assumed.
- Effective-store/capability discovery for inherited managers remains a separate
  contract decision. The current membership-only session list cannot stand in
  for all effective access.
- Approved Co.op Food brand/logo guidance and exact visual rules are pending.

This slice does not include the full module suite, a full design system,
`packages/ui` redesign, Pages cutover, unresolved API changes, production HEIC
policy, or a final brand system. Catalog publishing/primary supplier and future
module workflows remain separate outcomes. Nothing here authorizes deployment
or starts Round 2.
