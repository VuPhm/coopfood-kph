# Implementation plan — revision 4 amendment

Date: 2026-10-08. Bounded amendment to the existing `figma-mobile-implementation` cycle; owner acceptance remains pending.

## Request and exact reference findings

Owner said “tiếp tục” after confirming Feather React as the Store App icon set and permits a fresh subagent. The fresh control-icon review confirmed one mismatch in KPH Create: `CalendarInput` renders Lucide CalendarDays at 18px, while the mobile KPH frames `203:701` and `203:847` use Feather Calendar in a 20px trailing-action slot. The corresponding desktop fields `384:1072` and `540:1685` were re-read; they preserve the same field roles, while the assets/colors remain tied to each assigned screen field.

The detected-date field is read-only, disabled, and uses the existing muted local Figma export (`#667366`). The editable treatment-date field uses the existing screen-specific 20px Feather trailing-action asset (green `#006633`) from each KPH asset group. Keep these roles separate. Existing `imgFeatherCalendar` and `imgFeatherCalendar1` entries identify the sources for TPCN and TPTS; revision 3 asset/evidence files are historical and unchanged.

## Bounded implementation

- Add one optional icon presentation prop to `CalendarInput`; retain its existing Lucide default for every consumer that omits it.
- In `CreateRecordDialog`, pass the exact detected-date and treatment-date assets only when `presentation="screen"`, using the current TPCN/TPTS asset group.
- Add only scoped Store App CSS for a 20×20 image inside the existing trigger hit target.
- Add meaningful tests/assertions for default consumers, KPH field source/size/color, read-only disabled behavior, treatment calendar open/select/Escape/focus, and unaffected legacy consumers.
- Do not change date parsing, business rules, calendar portal, accessibility names, keyboard behavior, dialogs, shelf utility, packages/ui, dependency/config, API/backend, or Figma.

## Gates

Revision 3 technical gates are invalidated and pending until revision 4 has been committed and checked. Required technical gates: clean checkpoint integrity; unchanged workflow semantics including read-only detected date and picker keyboard/focus behavior; responsive mobile/desktop targeted browser checks at 390×844 and 1440×1024; exact source/color/geometry assertions; `npm run verify`. The memory-only preview remains at `http://127.0.0.1:5175/`. Owner visual/workflow acceptance remains pending.

Base checkpoint: `4031c62b985e3679efac11a52d9ee4df31b0cc47`, branch `store-app/figma-mobile-implementation`, worktree `/Users/vup/Documents/coopfood-kph`. Sole writer: `/root/luna_calendar_repair_fresh`. Review limit: 1. No merge, push, deploy, or Pages cutover.
