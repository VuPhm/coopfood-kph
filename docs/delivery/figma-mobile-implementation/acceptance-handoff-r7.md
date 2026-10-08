# UI repairs r7 — owner preview

09/10/2026. Isolated branch `store-app/qa-20261009-sheet-focus`, worktree
`/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph`. Preview:
[Store App mock](http://127.0.0.1:5177/). Candidate `0a9b933ce83072260dba530f77b4679959c7c51b` is recorded in [plan](plan.json).
This preview is separate from the other task's original worktree/port 5175.

## Changes to inspect

- Open KPH filter or Account, then close with Escape or the close button: focus returns to the opener. A filter calendar, scanner or image viewer closes its own layer and keeps the parent draft open.
- Open quick shelf utility, enter a date, open Account and press Escape: the quick utility and date remain. Changing route closes Account/quick utility and lands focus in the new content.
- DATE finds ` C24-118 `; desktop KPH finds a SKU/barcode with surrounding spaces. Leading zeros remain intact. DATE desktop details describe expired lots rather than a negative remaining count.
- Lookup finds the unique fixture `bánh quy`. Editing the query removes the previous result; a late response cannot replace the current product. An ambiguous name asks for a more precise identifier. Barcode misses still return no inferred product.
- Mobile header/tab heights, visible “Tạo ·” labels and card chevrons follow the read Figma references. Search icons have visible dark strokes. Lookup uses Feather FileText. Desktop DATE filter/add actions align on one row.

## Technical status and limits

[Evidence](technical-evidence-r7.md) records integrated tests/build and five headless
Playwright gates, including 390×844, 1440×1024 and seven responsive widths.
Owner visual/workflow acceptance remains pending; this is not a full pixel-parity claim.
Mock changes live only in the current session and reset on reload. Camera fallback
was exercised; real hardware and backend/API integration were not part of this round.

The other writer's shelf result component/tests/browser script and shelf CSS
selectors were excluded. Shared stylesheet integration needs review when combining
that task with this branch. No merge, push, deployment or Figma write occurred.

Next small step: inspect the scenarios above on port 5177 and record owner feedback
against this candidate before combining the independent worktrees.
