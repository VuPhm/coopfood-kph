# D01 revision 2 integration review

Owner request: “pass p04, tiếp tục phân task để các model nhỏ implement”, followed
by selecting D01, and “tiếp tục đoạn bị ngắt” / “tiếp” on resume.
P04 acceptance remains closed; D01 owner acceptance remains pending.

GPT-6 Luna high implemented three bounded parts in isolated worktrees:

- Backend: `8cf16fd` + `af6e979`, KPH Java and integration tests only.
- Store PWA: `5f235da` + `8434cb0`, Store source/tests only.
- Browser: `e1b4c92`, E2E seed/media/tests only.

Integrator reviewed scope, contract/client, diffs and results before cherry-pick.
After an interruption, temporary worktrees disappeared. Only the uncommitted
backend/frontend work was reassigned under `.local/worktrees`; the completed
E2E commit was reused. No duplicate user task or new product cycle was created.

## Round 1 — implementation findings, resolved

1. The prior D01 SQL ordered internal enum codes rather than visible Vietnamese
   labels. Backend now orders display-label expressions, including OTHER detail
   and manual-entry fallbacks, with PostgreSQL `vi-x-icu`. Tests prove category
   and quantity ordering in both directions and stable IDs across page boundaries.
2. Prior-page placeholder rows could be acted on during a page transition.
   Selection, per-row/batch review and export now reject placeholder data; both
   desktop/mobile controls show disabled states. A deferred response test covers
   the transition. Pilot and P05 password-change behavior remain covered.

## Round 2 — integrated browser findings, resolved in test source

1. E2E used uppercase `typeTotals.TPTS`, a frontend adapter shape, instead of the
   public API's lowercase `typeTotals.tpts`. Commit `992d1d5` fixes the assertion.
2. E2E waited for another HTTP response when returning to a fresh cached page.
   Commit `7fc9b8d` asserts exact rendered IDs/order instead, retaining page 1→2→1
   and page-local selection checks. No product code was changed for either repair.

Review is bounded to the D01 outcome. No migration, production rollout, C02,
O01, credential reset or unrelated refactor was added. Database collation does
not promise exact numeric/case/accent equivalence with Pilot's browser collator;
this is explicit in the contract and acceptance handoff.
