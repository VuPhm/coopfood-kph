# Implementation plan — revision 3 amendment

Date: 2026-10-08. This is a bounded amendment to the existing
[revision 2 plan](implementation-plan-r2.md), not a new cycle.

## Request and decision

The owner confirmed Feather React as the Store App icon set and asked to continue
the implementation loop. Fresh review found two mismatches in DATE screen node
`21:144`: the search glyph used Lucide in a 24px box instead of Feather Search
in an 18px slot, and the scan action used Lucide ScanLine instead of Feather
Maximize at 20px inside its 36px holder.

Use exact Feather React masters from Figma file `aEDpXtz0IiEkPiVucqjQ3Q`: Search
`25:16` / vector `269:209`, Maximize `25:20` / vector `269:212`. Preserve existing
query behavior, scanner open handler, button label and mock boundary. Keep the
current task branch/worktree and one writer. Reuse a byte-identical local
Maximize export; add a dedicated exact Search export because the previously
registered Search export had a white stroke. Do not install or migrate the
`react-feather` dependency; local Figma exports are the verified source for these
callsites.

## Scope and gates

Allowed changes are DATE callsite styling and assets, the Figma asset registry,
the responsive script's targeted DATE assertions, and this cycle's revision 3
records plus CURRENT_STATE/NEXT. No other Lucide consumers, product workflow,
contract, backend, API, dependency, or Figma frame changes are included.

Revision 2 workspace-integrity, responsive-assets, and mobile/desktop visual
interaction gates were invalidated. Workflow semantics were rechecked in the
revision 3 full verification and browser run; accessible labels and scanner
manual fallback remain present. Owner visual/workflow acceptance remains pending.

## Acceptance criteria

- DATE Search uses the exact 24px Feather source, rendered 18×18 at the Figma
  search slot's 12px left / 15px top offset.
- DATE Maximize uses the exact 24px Feather source, rendered 20×20 inside the
  36×36 scan holder; both strokes are `#1C261C`, width 2, round caps/joins.
- Headless responsive checks pass at the assigned 390×844 and 1440×1024 sizes;
  the complete existing responsive matrix may run as a stronger check.
- The DATE scan button opens the existing scanner and manual fallback returns
  input to the DATE search field.
- `npm run verify` passes. Technical readiness does not imply owner acceptance.

See [revision 3 technical evidence](technical-evidence-r3.md) and
[owner handoff](acceptance-handoff-r3.md).
