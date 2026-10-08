# Shelf input repair r9 — owner preview

09/10/2026. Branch `store-app/qa-20261009-sheet-focus`, worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`.
Candidate `3e6f763cf88a4b5bc19ae90c204f2d8441e85b9a` in [plan](plan.json). Preview: [Tra hạn lùi](http://127.0.0.1:5177/#shelf).
All r7 UI repairs and the r8 result card remain integrated.

## Changes to inspect

- Enter HSD 2 months before NSX 01/10/2026: the 2 stays and expiry becomes 01/12/2026. Changing NSX recalculates expiry; clearing/re-entering NSX retains the duration. The same applies to days and to unknown-NSX mode using HSD as the anchor.
- Paste -2 or 1.5 into a duration and submit: the original value stays, the field becomes invalid, its message explains positive whole numbers and focus returns there. Correct it to 10 to recover. A valid 10000 days stays intact rather than becoming 1000.
- Submit incomplete dates or HSD ≤ NSX: focus moves to the field needing correction after its error association is rendered. Edit/reset clears the error; main and quick utilities have separate error IDs.
- Try NSX 31/01/2028 and 1 month: expiry is 29/02/2028 using the existing month-end rule. Changing mode derives in the other direction and updates the day count. Manual HSD in known mode selects the date pair instead of keeping an older duration as the source.
- From KPH open quick utility and repeat the input/error recovery. Opening and closing Account preserves its draft/error; Escape closes the quick utility and returns focus to the FAB. The result card/timeline styling stays as r8.

[Evidence r9](technical-evidence-r9.md): 229 tests/build PASS, five Playwright gates
PASS at mobile/desktop, seven responsive sizes and extra 375px quick geometry.
Technical review is complete; owner visual/workflow acceptance is still pending.
Preview is synthetic and resets on reload; real-device/backend verification remains
outside this round. No deployment occurred.

Next small step: inspect duration-first entry and invalid-to-valid recovery on the
main/quick forms, then record owner feedback against this candidate.
