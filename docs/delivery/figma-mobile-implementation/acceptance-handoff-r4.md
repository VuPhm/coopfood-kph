# Owner acceptance handoff — revision 4

The bounded KPH calendar repair is ready in the memory-only mock preview at <http://127.0.0.1:5175/>.

At mobile `390×844` and desktop `1440×1024`, open KPH and create a TPCN and TPTS ticket. The read-only detected-date field should show the muted `#667366` Feather Calendar at 20×20, and its trigger must remain disabled. The treatment-date trigger should show the screen-specific green `#006633` Feather Calendar at 20×20. Open its picker, select a date, then reopen and press Escape; the value, expanded state and trigger focus should behave as before.

The default CalendarInput icon remains in all consumers that do not opt in, including dialog presentation, online/Pilot history, and the shelf utility. Date parsing and KPH workflow behavior are unchanged.

Viewport screenshots are available at:

- `.local/figma-mobile/kph-calendar-203-701-390x844.png` and `.local/figma-mobile/kph-calendar-203-701-treatment-390x844.png`
- `.local/figma-mobile/kph-calendar-203-847-390x844.png` and `.local/figma-mobile/kph-calendar-203-847-treatment-390x844.png`
- `.local/figma-mobile/kph-calendar-203-701-1440x1024.png`
- `.local/figma-mobile/kph-calendar-203-847-1440x1024.png`

`npm run verify` and the targeted responsive browser check pass; see [technical evidence](technical-evidence-r4.md) and [asset details](assets-r4.json). This handoff requests the owner’s visual/workflow decision and does not record acceptance.
